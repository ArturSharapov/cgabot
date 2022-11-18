import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import moment from 'moment'
import { concatMap, Subject } from 'rxjs'
import { ChesscomService } from 'src/modules/chesscom/chesscom.service'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { IOpenTesting } from '../open-testing/open-testing.interface'
import { PostStatus } from '../posts/post.interface'
import { generateFullTitle } from '../posts/posts.functions'
import { PostsService } from '../posts/posts.service'
import { ForumTasksService } from '../tasks/forum-tasks.service'
import { generateResponseTemplate } from '../templates/response-template'
import { IPostEdit, isForumPostEditType, PostEditType } from './post-edits.interface'

@Injectable()
export class PostEditsService implements OnModuleInit {
  private readonly logger = new Logger(PostEditsService.name)
  private readonly subject = new Subject<IPostEdit & { id: string }>()

  constructor(
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly chesscomService: ChesscomService,
    private readonly postsService: PostsService,
    private readonly forumTasksService: ForumTasksService,
  ) {}

  async onModuleInit() {
    this.realtimeDatabaseService.onNewPostEdit = async (edit, id) => {
      this.logger.debug(`Got a new Edit (${PostEditType[edit.type]}: \`${edit.value}\`)`)
      this.subject.next({ ...edit, id })
    }

    this.subject
      .pipe(
        concatMap(async (edit) => {
          return { editId: edit.id, success: await this.apply(edit), postId: edit.postId }
        }),
      )
      .subscribe({
        next: (value) => {
          this.forumTasksService.checkSpecificPost(value.postId)
          this.realtimeDatabaseService.completePostEdit(value.editId, value.success)
        },
      })
  }

  private async apply(edit: IPostEdit): Promise<boolean> {
    const post = this.postsService.get(edit.postId) ?? (await this.postsService.forceGet(edit.postId))
    // const outdated = !this.postsService.get(edit.postId)
    if (!post || (post.deleted && isForumPostEditType(edit.type))) return false
    switch (edit.type) {
      case PostEditType.Title: {
        const newTitle = generateFullTitle(post.status, post.type, edit.value)
        return await this.chesscomService.editPostTitle(post.link, newTitle)
      }
      case PostEditType.Type: {
        const newTitle = generateFullTitle(post.status, edit.value, post.title)
        return await this.chesscomService.editPostTitle(post.link, newTitle)
      }
      case PostEditType.Locked: {
        return await this.chesscomService.lockPost(post.link, edit.value)
      }
      case PostEditType.Status: {
        if (!post.responseId) return false
        const newTitle = generateFullTitle(edit.value, post.type, post.title)
        const pending = [this.chesscomService.editPostTitle(post.link, newTitle)]
        if (post.locked) {
          pending.push(
            (async () => {
              const result = []
              await this.realtimeDatabaseService.updatePost(edit.postId, 'editing', true)
              result.push(await this.chesscomService.lockPost(post.link, false))
              result.push(
                await this.chesscomService
                  .editComment(post.link, post.responseId, generateResponseTemplate({ ...post, status: edit.value }))
                  .then((x) => x.result),
              )
              result.push(await this.chesscomService.lockPost(post.link, true))
              await this.realtimeDatabaseService.updatePost(edit.postId, 'editing', null)
              return result.every(Boolean)
            })(),
          )
        } else
          pending.push(
            this.chesscomService.editComment(post.link, post.responseId, generateResponseTemplate({ ...post, status: edit.value })).then((x) => x.result),
          )
        return (await Promise.all(pending)).every(Boolean)
      }
      case PostEditType.Message: {
        if (!post.responseId || post.status > PostStatus.Pending) return false
        if (post.locked) {
          const result = []
          await this.realtimeDatabaseService.updatePost(edit.postId, 'editing', true)
          result.push(await this.chesscomService.lockPost(post.link, false))
          result.push(
            await this.chesscomService
              .editComment(post.link, post.responseId, generateResponseTemplate({ ...post, message: edit.value }))
              .then((x) => x.result),
          )
          result.push(await this.chesscomService.lockPost(post.link, true))
          await this.realtimeDatabaseService.updatePost(edit.postId, 'editing', null)
          return result.every(Boolean)
        }
        return await this.chesscomService
          .editComment(post.link, post.responseId, generateResponseTemplate({ ...post, message: edit.value }))
          .then((x) => x.result)
      }
      case PostEditType.OpenTestingStatus: {
        const openTesting: IOpenTesting = {
          dateStarted: post.openTesting?.dateStarted ?? moment().valueOf(),
          status: edit.value,
          durations: post.openTesting?.durations ?? {},
          players: post.openTesting?.players ?? {},
        }
        let result = false
        await Promise.all([
          this.realtimeDatabaseService.updateOpenTestingStatus(edit.postId, edit.value),
          this.chesscomService.editComment(post.link, post.responseId, generateResponseTemplate({ ...post, openTesting })).then((x) => (result = x.result)),
        ])
        return result
      }
      case PostEditType.Notes: {
        await this.realtimeDatabaseService.updatePost(edit.postId, 'notes', edit.value)
        return true
      }
      case PostEditType.PrimaryReviewer: {
        await this.realtimeDatabaseService.updatePost(edit.postId, 'primaryReviewer', edit.value)
        return true
      }
      case PostEditType.AssistantReviewers: {
        await this.realtimeDatabaseService.updatePost(edit.postId, 'assistantReviewers', edit.value)
        return true
      }
      case PostEditType.ConfirmDelete: {
        if (!post.deleted) return false
        if (edit.value) await this.realtimeDatabaseService.deletePost(edit.postId)
        else await this.realtimeDatabaseService.updatePost(edit.postId, 'deleted', null)
        return true
      }
      default: {
        this.logger.error(`!NEVER Invalid PostEditType (${edit.type})`)
        return false
      }
    }
  }
}

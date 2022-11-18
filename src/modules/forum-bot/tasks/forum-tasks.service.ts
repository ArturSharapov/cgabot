import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import parseHTML from 'node-html-parser'
import { concatMap, exhaustMap, filter, from, mergeAll, Subject, timer } from 'rxjs'
import { ChesscomService } from 'src/modules/chesscom/chesscom.service'
import { CHECK_NEW_POSTS_INTERVAL, CHECK_POSTS_INTERVAL } from '../config'
import { PostsService } from '../posts/posts.service'
import { PostEvaluationService } from './post-evaluation.service'

@Injectable()
export class ForumTasksService {
  private logger = new Logger(ForumTasksService.name)
  constructor(
    private readonly postsService: PostsService,
    private readonly chesscomService: ChesscomService,
    private readonly postEvaluationService: PostEvaluationService,
    private readonly configService: ConfigService,
  ) {}

  private clubLink = this.configService.get<string>('ForumBot.clubLink') ?? ''

  checkNewPosts = timer(0, CHECK_NEW_POSTS_INTERVAL).pipe(
    exhaustMap(async () => {
      const links = await this.chesscomService.getResentPosts(this.clubLink)
      if (links && links.length) {
        const newPostIds = await this.postsService.addNewPosts(links)
        if (newPostIds.length) this.checkSpecificPostsSubject.next(newPostIds)
        return
      }
      this.logger.error(`Failed to get recent posts`)
      return
    }),
  )

  checkPosts = timer(0, CHECK_POSTS_INTERVAL).pipe(
    exhaustMap(() => {
      if (!this.postsService.ids.length) {
        this.logger.warn('The posts array is empty. Is that possible?')
      }
      return from(this.postsService.ids.map((id) => this.checkPost(id))).pipe(mergeAll(), filter(Boolean))
    }),
  )

  private checkSpecificPostsSubject = new Subject<string[]>()

  checkSpecificPost = (postId: string) => this.checkSpecificPostsSubject.next([postId])

  checkSpecificPostsObservable = this.checkSpecificPostsSubject.pipe(
    concatMap((postIds) => from(postIds.map((id) => this.checkPost(id, true))).pipe(mergeAll(), filter(Boolean))),
  )

  private checkPost = async (postId: string, log?: true) => {
    const post = this.postsService.get(postId) ?? (await this.postsService.forceGet(postId))
    if (!post || post.deleted) return false
    if (log) this.logger.debug(`Checking post (${post.title})`)

    const data = await this.chesscomService.getPostData(post.link)
    if (!data) {
      this.logger.error(`Failed to get post data (${post.link})`)
      return false
    }
    if (data === 'deleted') {
      await this.postsService.markPostAsDeleted(postId)
      return false
    }
    const body = parseHTML(data)
    return await this.postEvaluationService.evaluatePost(postId, post, body)
  }
}

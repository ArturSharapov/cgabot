import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as moment from 'moment'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { POSTS_LIMIT, POSTS_LIMIT_DURATION, POSTS_LIMIT_MESSAGE } from '../config'
import { DEFAULT_POST } from './post.constants'
import { IPost, PostStatus, PostType } from './post.interface'

@Injectable()
export class PostsService implements OnModuleInit {
  private readonly logger = new Logger(PostsService.name)

  constructor(private readonly realtimeDatabaseService: RealtimeDatabaseService) {}

  private posts: IPost[] = []
  private indices: { [postId: string]: number } = {}
  private keys: string[] = []

  async onModuleInit() {
    await new Promise<true>((resolve) => {
      this.realtimeDatabaseService.onPostChange = async (posts, indices, keys) => {
        this.posts = posts
        this.indices = indices
        this.keys = keys
        for (const listener of this.postsListeners) listener(keys, posts)
        resolve(true)
      }
    })
  }

  private postsListeners: ((keys: string[], posts: IPost[]) => void)[] = []
  set newPostsListener(listener: (keys: string[], posts: IPost[]) => void) {
    this.postsListeners.push(listener)
    listener(this.keys, this.posts)
  }

  get(postId: string) {
    return this.posts[this.indices[postId]]
  }

  forceGet(postId: string) {
    return this.realtimeDatabaseService.getPost(postId)
  }

  get ids() {
    return this.keys
  }

  private async findNewLinks(links: string[]) {
    let linkIndex = links.length - 2
    let postIndex = this.posts.findIndex((post) => post.link === links.last)
    if (~postIndex) {
      const pendingDeletionMarks = []
      while (postIndex !== 0 && linkIndex !== -1) {
        postIndex--
        if (this.posts[postIndex].deleted) continue
        if (links[linkIndex] === this.posts[postIndex].link) linkIndex--
        else pendingDeletionMarks.push(this.markPostAsDeleted(this.keys[postIndex]))
      }
      while (postIndex !== 0) {
        postIndex--
        if (!this.posts[postIndex].deleted) pendingDeletionMarks.push(this.markPostAsDeleted(this.keys[postIndex]))
      }
      await Promise.all(pendingDeletionMarks)
      return links.slice(0, linkIndex + 1)
    } else return links
  }

  async addNewPosts(links: string[]) {
    const timestamp = moment().valueOf()
    const newLinks = await this.findNewLinks(links)
    const newPostIds = await Promise.all(
      newLinks.map((link, i) => this.realtimeDatabaseService.addNewPost({ ...DEFAULT_POST, dateCreated: timestamp - i, dateUpdated: timestamp - i, link })),
    )
    return newPostIds.defined()
  }

  markPostAsDeleted(postId: string) {
    return this.realtimeDatabaseService.updatePost(postId, 'deleted', true)
  }

  doesComplyLimit(author: string, postId: string) {
    const dateCreated = moment(this.get(postId).dateCreated)
      .subtract(...POSTS_LIMIT_DURATION)
      .valueOf()
    let result = 0
    for (let index = this.indices[postId] + 1; index < this.keys.length; index++) {
      if (this.posts[index].type >= PostType.Other || dateCreated < dateCreated) break
      if (this.posts[index].author === author && !(this.posts[index].status === PostStatus.Declined && this.posts[index].message === POSTS_LIMIT_MESSAGE))
        result++
    }
    return result < POSTS_LIMIT
  }
}

// if (post.type < PostType.Other && post.status >= PostStatus.RNM) {
//   // requirements need to be checked
//   newStatus = PostStatus.UR
// }
// let screenshot = post.screenshot
// if (games.last !== post.gameNr) {
//   const game = await this.chesscomService.getGame(games.last)
//   const image = await this.boardDrawerService.draw(game?.fen, Boolean(game?.customData?.ruleVariants?.koth))
//   screenshot = (await this.imageHostingService.upload(newTitle, image)) ?? ''
// }
//
// newContent = generatePostTemplate(screenshot, [{number: 1234, final: true}], '<timecontrol>', '<gamerules>', '<promotion>', note)

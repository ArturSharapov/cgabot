import { Query } from '@firebase/database-types'
import { Injectable, Logger } from '@nestjs/common'
import * as moment from 'moment'
import { Reference } from 'node_modules/@firebase/database-types'
import { Subscription, timer } from 'rxjs'
import { momentAgo } from 'src/functions'
import { FirebaseAdminService } from 'src/modules/firebase/firebase-admin.service'
import { CHECK_POSTS_DURATION, CHECK_POSTS_LIMIT, POSTS_RESUBSCRIBE_INTERVAL } from 'src/modules/forum-bot/config'
import { IOpenTestingGame, IOpenTestingPlayers, OpenTestingStatus } from 'src/modules/forum-bot/open-testing/open-testing.interface'
import { IPostEdit, isPostEdit } from 'src/modules/forum-bot/post-edits/post-edits.interface'
import { IPost } from 'src/modules/forum-bot/posts/post.interface'

@Injectable()
export class RealtimeDatabaseService {
  private readonly logger = new Logger(RealtimeDatabaseService.name)
  constructor(firebaseAdminService: FirebaseAdminService) {
    this.db = firebaseAdminService.database.ref()
    // this.test()
  }

  // private async test() {
  //   const message = this.db.child(`chesscom-api/messages`).push({ action: 'nothing' })
  //   const response = (await message.child('response').orderByValue().equalTo(3).once('value')).val()
  //   this.logger.debug(response)
  // }

  private readonly db: Reference

  set onNewPostEdit(listener: (value: IPostEdit, key: string) => Promise<void>) {
    this.db
      .child('forum-bot/edits')
      .orderByChild('success')
      .equalTo(null)
      .on('child_added', (snapshot) => {
        if (!snapshot.key) return
        const value = snapshot.val()
        if (isPostEdit(value)) listener(value, snapshot.key)
        else {
          this.logger.error(`Invalid PostEdit schema (${snapshot.key})`)
          this.completePostEdit(snapshot.key, false)
        }
      })
  }

  private postsResubscribeTimerSubscription: Subscription
  private ref: Query

  set onPostChange(listener: (values: IPost[], indices: { [k: string]: number }, keys: string[]) => Promise<void>) {
    if (this.postsResubscribeTimerSubscription) this.postsResubscribeTimerSubscription.unsubscribe()
    this.postsResubscribeTimerSubscription = timer(0, POSTS_RESUBSCRIBE_INTERVAL).subscribe({
      next: () => {
        if (this.ref) this.ref.off()
        this.logger.debug('Resubscribing to posts')
        const postsRef = this.db.child('forum-bot/posts').orderByChild('dateCreated')
        this.ref = postsRef.startAt(momentAgo(CHECK_POSTS_DURATION))
        this.ref.get().then((snapshot) => {
          if (snapshot.numChildren() < CHECK_POSTS_LIMIT) this.ref = postsRef.limitToLast(CHECK_POSTS_LIMIT)
          this.ref.on('value', (snapshot) => {
            const indices: { [k: string]: number } = {}
            const keys: string[] = []
            const values: IPost[] = []
            const numChildren = snapshot.numChildren()
            snapshot.forEach((child) => {
              if (!child.key) return
              keys.unshift(child.key)
              values.unshift(child.val())
              indices[child.key] = numChildren - keys.length
            })
            listener(values, indices, keys)
          })
        })
      },
    })
  }

  async getPost(postId: string) {
    return (await this.db.child(`forum-bot/posts/${postId}`).get()).val()
  }

  updatePost(postId: string, property: keyof IPost, value: any) {
    // this.logger.debug(`Updated post (${property}: ${value})`)
    return this.db.child(`forum-bot/posts/${postId}/${property}`).set(value)
  }

  deletePost(postId: string) {
    return this.db.child(`forum-bot/posts/${postId}`).set(null)
  }

  completePostEdit(editId: string, success: boolean) {
    return this.db.child(`forum-bot/edits/${editId}/success`).set(success)
  }

  async addNewPost(post: IPost) {
    this.logger.debug(`Received new post (${post.link.substring(39)})`)
    const reference = this.db.child(`forum-bot/posts`).push()
    await reference.set(post)
    return reference.key
  }

  async sendMessage(action: string, data: any) {
    const message = await this.db.child(`chesscom-api/messages`).push({ type: 'send', payload: { action, data: JSON.stringify(data) } })
    await message.child('response').once('child_added')
    const response = (await message.child('response').once('value')).val()
    setTimeout(() => message.remove(), 3000)
    if (response.body) response.body = JSON.parse(response.body)
    return response
  }

  receiveMessage<T = any>(predicate?: string, transform?: string) {
    const message = this.db.child(`chesscom-api/messages`).push()
    const responseRef = message.child('response')
    let isRunnung = false
    const cancel = async () => {
      if (isRunnung) {
        await responseRef.set({ success: false })
        isRunnung = false
      }
    }
    const get = async () => {
      isRunnung = true
      await message.set({ type: 'receive', payload: { predicate: predicate ?? null, transform: transform ?? null } })
      await responseRef.once('child_added')
      const response: { success: boolean; body?: string } = (await responseRef.once('value')).val()
      setTimeout(() => message.remove(), 3000)
      if (response.body) response.body = JSON.parse(response.body)
      return response as { success: boolean; body?: T }
    }
    return { get, cancel }
  }

  addNewOpenTestingGame(postId: string, gameNr: number) {
    return this.db.child(`forum-bot/open-testing-games`).push({ gameNr, postId, dateStarted: moment().valueOf() })
  }

  set onNewOpenTestingGame(listener: (openTestingGame: IOpenTestingGame) => void) {
    this.db.child(`forum-bot/open-testing-games`).on('child_added', (snapshot) => {
      if (!snapshot.key) return
      listener({ ...snapshot.val(), key: snapshot.key })
    })
  }

  removeOpenTestingGame(openTestingGameId: string) {
    return this.db.child(`forum-bot/open-testing-games/${openTestingGameId}`).remove()
  }

  updateOpenTestingPlayers(postId: string, updates: IOpenTestingPlayers) {
    return this.db.child(`forum-bot/posts/${postId}/openTesting/players`).update(updates)
  }

  updateOpenTestingDurations(postId: string, gameNr: number, duration: number) {
    return this.db.child(`forum-bot/posts/${postId}/openTesting/durations/${gameNr}`).set(duration)
  }

  updateOpenTestingStatus(postId: string, openTestingStatus: OpenTestingStatus) {
    return this.db.child(`forum-bot/posts/${postId}/openTesting/status`).set(openTestingStatus)
  }

  updateOpenTestingDateStarted(postId: string, dateStarted: number) {
    return this.db.child(`forum-bot/posts/${postId}/openTesting/dateStarted`).set(dateStarted)
  }
}

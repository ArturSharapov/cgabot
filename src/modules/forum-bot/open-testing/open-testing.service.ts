import { Injectable, Logger } from '@nestjs/common'
import * as moment from 'moment'
import { concatMap, exhaustMap, mergeMap, Subject } from 'rxjs'
import { TimeoutTimer } from 'src/common/timeout-timer.service'
import { momentAgo, sleep } from 'src/functions'
import { ChesscomService } from 'src/modules/chesscom/chesscom.service'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { IPost, PostStatus, PostType } from '../posts/post.interface'
import { PostsService } from '../posts/posts.service'
import { generateResponseTemplate } from '../templates/response-template'
import { OPEN_TESTING_DURATION, OPEN_TESTING_TITLE, QUEUE_LIFETIME, SELF_AVATAR, SELF_ID, SELF_USERNAME } from './open-testing.config'
import { IOpenTesting, OpenTestingStatus, QueueData } from './open-testing.interface'

@Injectable()
export class OpenTestingService {
  private readonly logger = new Logger(OpenTestingService.name)
  constructor(
    private readonly postsService: PostsService,
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly chesscomService: ChesscomService,
  ) {
    this.subscribeToPosts()
    this.subscribeToQueue()
    this.queueSubject.next('auto')
  }

  private queueTimer = new TimeoutTimer(QUEUE_LIFETIME, () => this.queueSubject.next('auto'))

  private postIds: string[] = []
  private current = -2 // index of postIds

  private cancelQueue: () => Promise<void> = async () => void 0

  private queueSubject = new Subject<number | 'auto'>()

  private async hostPosition(postId: string) {
    this.logger.debug(`Hosting position (${this.current})`)

    const getPlayers = this.realtimeDatabaseService
      .receiveMessage<{ playerId: number }[]>(
        `x => x.mutation === 'queues'`,
        `x => x.data.queues.find(q => q.qId === ${SELF_ID})?.players.map(p => ({playerId: p.playerId, username: p.username}))`,
      )
      .get()
    await this.realtimeDatabaseService.sendMessage('subscribe-queue', null)
    const players = (await getPlayers).body ?? []

    const post = this.postsService.get(postId)
    if (!post.requirements || !post.requirements.position.other) return

    const positionData = JSON.parse(post.requirements.position.other)

    const description = `
    <div>
      Welcome to the Open Testing!
      <br>
      Test new custom positions made by 4PC and Variants community, leave your votes (+1 or -1), and write useful feedback on the forum!
    </div>
    <div style="margin: 12px 0;">
      <a href="${post.link}" target="_blank" rel="noopener" style="text-decoration: underline; font-weight: 700;">
        ${PostType[post.type]}: ${post.title}
      </a>
    </div>`
    const queueData = {
      qId: SELF_ID,
      title: OPEN_TESTING_TITLE,
      gameType: positionData.gameType,
      ratingMode: 'std',
      casual: true,
      timeControlInitial: positionData.timeControlInitial,
      increment: positionData.increment,
      isDelay: positionData.isDelay,
      players: [...players.filter((player) => player.playerId !== SELF_ID)],
      ruleVariants: positionData.ruleVariants,
      inviterUsername: SELF_USERNAME,
      startFen: positionData.startFen,
      maxRating: 4000,
      custSP: true,
      whiteBlack: positionData.whiteBlack,
      noCorners: positionData.whiteBlack,
      numRequired: positionData.numRequired,
      numZombies: positionData.numZombies,
      existingSeats: positionData.existingSeats,
      twoPlayer: positionData.twoPlayer,
      fairyPiecesExist: positionData.fairyPiecesExist,
      twoPlayerWhiteVsBlack: positionData.twoPlayerWhiteVsBlack,
      type: positionData.type,
      teams: positionData.type === 'teams' ? true : false,
      grasshoppersExist: positionData.grasshoppersExist,
      avgDur: 400,
      timeControl: positionData.timeControl,
      ratingComposites: [],
      positionName: post.title,
      typeName: positionData.typeName,

      lastChecked: Date.now(),
      inviterAvatarUrl: SELF_AVATAR,
      isPublic: true, //false,
      manualStart: true,
      excludeMe: true,
      disablePlayAgain: true,

      ratingType: 'rt:wof:' + positionData.timeControlType,
      timeControlType: 'news',
      textForSearch: 'Open Testing',
      description: description,
      icon: '4pc.svg',

      // subtitle: '',
      teaserText: 'NCV WoF cgabot',
      description2: `
      <div style="margin-top: -180px; margin-right: 30px; background: #ffffff; position: absolute; padding: 20px 0">
        ${description}
      </div>`,
      // variantUrl: 'wof',
    }

    const queueMessage = this.realtimeDatabaseService.receiveMessage<QueueData>(
      `x => x.mutation === 'queue' && x.data.qId === ${SELF_ID} && x.data.players.length >= x.data.numRequired`,
      `x => ({ players: x.data.players.filter(p => p.playerId !== ${SELF_ID}), seats: x.data.existingSeats })`,
    )
    this.cancelQueue = async () => {
      this.cancelQueue = async () => void 0
      await queueMessage.cancel()
    }
    const getQueue = queueMessage.get()
    await this.realtimeDatabaseService.sendMessage('update-queue', queueData)
    await this.realtimeDatabaseService.sendMessage('update-queue', queueData)
    const queueResult = await getQueue
    if (!queueResult.success || !queueResult.body) {
      this.logger.debug(`Queue canceled`)
      return
    }

    const shuffledPlayers = queueResult.body.players.shuffle()
    const finalPlayers: (Record<string, never> | { playerId: number; seat: number })[] = new Array(4).fill({})
    for (const index in queueResult.body.seats) finalPlayers[queueResult.body.seats[index]] = { ...shuffledPlayers[index], seat: queueResult.body.seats[index] }

    const getGameNr = this.realtimeDatabaseService.receiveMessage<number>(`x => x.mutation === 'observe_your_game'`, `x => x.data`).get()
    await this.realtimeDatabaseService.sendMessage('start-game', { qId: SELF_ID, finalPlayers })
    const { body: gameNr } = await getGameNr

    if (!gameNr) throw new Error('observe_your_game returned undefined')
    this.realtimeDatabaseService.addNewOpenTestingGame(postId, gameNr)
    await sleep(5e3)
  }

  private async unhostPosition() {
    this.logger.debug(`Un-hosting position`)
    await this.realtimeDatabaseService.sendMessage('update-queue', { qId: SELF_ID, players: [] })
    await this.realtimeDatabaseService.sendMessage('cancel-queue', { qId: SELF_ID })
    return
  }

  private subscribeToQueue() {
    let pendingObserver = false
    this.queueSubject
      .pipe(
        mergeMap(async (newCurrent: number | 'auto') => {
          this.logger.debug(`Going to switch position (${this.current} → ${newCurrent}) [posts: ${this.postIds.length}]`)
          await this.cancelQueue()
          pendingObserver = true
          return newCurrent
        }),
        exhaustMap(async (newCurrent: number | 'auto') => {
          this.logger.debug(`Switching position (${this.current} → ${newCurrent}) [posts: ${this.postIds.length}]`)
          if (this.postIds.length) {
            this.current = newCurrent === 'auto' ? (this.current >= 0 && this.current + 1 < this.postIds.length ? this.current + 1 : 0) : newCurrent
            this.queueTimer.restart()

            const post = this.postsService.get(this.postIds[this.current])

            if (post.openTesting && post.openTesting.dateStarted <= momentAgo(OPEN_TESTING_DURATION)) {
              const status = OpenTestingStatus.Finished
              await Promise.all([
                this.realtimeDatabaseService.updateOpenTestingStatus(this.postIds[this.current], status),
                this.chesscomService.editComment(
                  post.link,
                  post.responseId,
                  generateResponseTemplate({ ...post, openTesting: { ...post.openTesting, status } }),
                ),
              ])
              this.logger.debug(`Finished`)
            } else {
              await this.hostPosition(this.postIds[this.current])
              this.logger.debug(`Hosted`)
            }

            this.queueSubject.next('auto')
          } else if (this.current !== -1) {
            this.current = -1
            await this.unhostPosition()
            this.logger.debug(`Un-hosted`)
            if (pendingObserver) {
              this.queueSubject.next('auto')
            }
          }
          pendingObserver = false
        }),
      )
      .subscribe()
  }

  private subscribeToPosts() {
    const postsSubject = new Subject<{ keys: string[]; posts: IPost[] }>()
    this.postsService.newPostsListener = (keys: string[], posts: IPost[]) => {
      postsSubject.next({ keys, posts })
    }

    postsSubject
      .pipe(
        concatMap(async ({ keys, posts }) => {
          const oldIndices: O = {}
          const newIndices: O = {}
          for (const index in this.postIds) oldIndices[this.postIds[index]] = this.postIds

          let nextIndex = this.postIds.length
          for (const index in keys) {
            const post = posts[index]
            if (!post.responseId) continue
            if (post.openTesting && post.openTesting.status !== OpenTestingStatus.Finished && post.openTesting.dateStarted) {
              if (post.openTesting.dateStarted > momentAgo(OPEN_TESTING_DURATION) && !post.deleted) {
                if (post.status === PostStatus.UR && post.openTesting.status === OpenTestingStatus.On) {
                  newIndices[keys[index]] = oldIndices[keys[index]] ?? ++nextIndex
                }
              } else {
                const status = OpenTestingStatus.Finished
                await Promise.all([
                  this.realtimeDatabaseService.updateOpenTestingStatus(keys[index], status),
                  post.deleted ||
                    this.chesscomService.editComment(
                      post.link,
                      post.responseId,
                      generateResponseTemplate({ ...post, openTesting: { ...post.openTesting, status } }),
                    ),
                ])
              }
            } else if (post.status === PostStatus.UR && !post.openTesting) {
              const openTesting: IOpenTesting = {
                dateStarted: moment().valueOf(),
                durations: {},
                players: {},
                status: OpenTestingStatus.On,
              }
              await Promise.all([
                this.realtimeDatabaseService.updateOpenTestingStatus(keys[index], openTesting.status),
                this.realtimeDatabaseService.updateOpenTestingDateStarted(keys[index], openTesting.dateStarted),
                this.chesscomService.editComment(post.link, post.responseId, generateResponseTemplate({ ...post, openTesting })),
              ])
            }
          }

          let newCurrent = -1
          const sortedKeys = Object.keys(newIndices).sort((a, b) => newIndices[a] - newIndices[b])
          for (const newIndex in sortedKeys) {
            if (!~newCurrent && newIndices[sortedKeys[newIndex]] >= this.current) newCurrent = +newIndex
          }
          if (!~newCurrent && sortedKeys.length) newCurrent = 0

          return { postIds: sortedKeys, newCurrent }
        }),
      )
      .subscribe({
        next: (value) => {
          // this.logger.warn(`Posts have been updated (${value.postIds})`)
          this.postIds = value.postIds
          if (this.current !== value.newCurrent) {
            this.queueSubject.next(value.newCurrent)
          }
        },
      })
  }
}

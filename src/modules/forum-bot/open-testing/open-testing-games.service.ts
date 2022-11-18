import { Injectable, Logger } from '@nestjs/common'
import * as moment from 'moment'
import { exhaustMap, filter, from, mergeMap, timer } from 'rxjs'
import { momentAgo } from 'src/functions'
import { ChesscomService } from 'src/modules/chesscom/chesscom.service'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { PostsService } from '../posts/posts.service'
import { generateResponseTemplate } from '../templates/response-template'
import { CHECK_GAME_DURATION, CHECK_GAME_INTERVAL, OPEN_TESTING_DURATION } from './open-testing.config'
import { GameData, IOpenTestingGame, IOpenTestingPlayers, OpenTestingStatus, OpenTestingVote } from './open-testing.interface'

@Injectable()
export class OpenTestingGamesService {
  private readonly logger = new Logger(OpenTestingGamesService.name)
  constructor(
    private readonly postsService: PostsService,
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly chesscomService: ChesscomService,
  ) {
    this.realtimeDatabaseService.onNewOpenTestingGame = (newOpenTestingGame: IOpenTestingGame) => {
      this.games.push(newOpenTestingGame)
      this.logger.debug(`Received new OpenTesting game: ${newOpenTestingGame.gameNr}`)
    }
    this.checkGames.subscribe()
  }

  private games: IOpenTestingGame[] = []

  private checkGames = timer(0, CHECK_GAME_INTERVAL).pipe(
    exhaustMap(() =>
      from(this.games).pipe(
        mergeMap(async (game) => {
          const post = this.postsService.get(game.postId)

          let openTestingStatus = post?.openTesting?.status
          if (post && post.openTesting && post.openTesting.dateStarted <= momentAgo(OPEN_TESTING_DURATION)) {
            openTestingStatus = OpenTestingStatus.Finished
            await Promise.all([
              this.realtimeDatabaseService.updateOpenTestingStatus(game.postId, openTestingStatus),
              this.chesscomService.editComment(
                post.link,
                post.responseId,
                generateResponseTemplate({ ...post, openTesting: { ...post.openTesting, status: openTestingStatus } }),
              ),
            ])
          }

          if (!post || openTestingStatus === OpenTestingStatus.Finished || game.dateStarted <= momentAgo(CHECK_GAME_DURATION)) {
            this.logger.debug(`Removing Open Testing game: ${game.gameNr}`)
            await this.removeGame(game)
            return
          }
          const getGameData = this.realtimeDatabaseService
            .receiveMessage<'not_found' | 'not_finished' | GameData>(
              `x => (x.mutation === 'game_not_found' && x.data === ${game.gameNr}) || ((x.mutation === 'live_game' || x.mutation === 'archive_game') && x.data.gameNr === ${game.gameNr})`,
              `x => {
                if (x.mutation === 'game_not_found') return 'not_found'
                if (x.mutation === 'live_game') return 'not_finished'
                const players = [x.data.uid1, x.data.uid2, x.data.uid3, x.data.uid4].filter(Boolean)
                const endDate = x.data.pgn4.match(/date=([\\d:.ZT-]+) clock=\\d+ \\} $/)[1]
                const { date: startDate, plies } = x.data
                const chat = x.data.chat.filter(c => /^([+-])1$/.test(c.message)).map(c => ({ playerId: c.playerId, message: c.message, timestamp: c.time }))
                const aborted = x.data.result === 'Aborted'
                return { plies, startDate, endDate, players, chat, aborted }
              }`,
            )
            .get()
          this.realtimeDatabaseService.sendMessage('game', { action: 'join', gameNr: game.gameNr })
          const { body: gameData } = await getGameData
          if (!gameData) return
          if (gameData === 'not_found') {
            await this.removeGame(game)
            return
          }
          // await this.realtimeDatabaseService.sendMessage('game', { action: 'exit', gameNr: game.gameNr })
          if (gameData === 'not_finished') return
          if (gameData.aborted) {
            await this.removeGame(game)
            return
          }
          const result = await this.evaluateGame(game.postId, game.gameNr, gameData)

          return result
        }),
        filter(Boolean),
        // tap(() => {
        //   console.log(this.games.map((x) => x.key))
        // }),
      ),
    ),
  )

  private async evaluateGame(postId: string, gameNr: number, gameData: GameData) {
    const post = this.postsService.get(postId)
    if (!post || !post.openTesting) return
    const duration = moment(gameData.endDate).diff(gameData.startDate)
    const startDate = moment(gameData.startDate).valueOf()

    const updates: IOpenTestingPlayers = {}
    for (const player of gameData.players) {
      if (!(post.openTesting.players && player in post.openTesting.players)) updates[player] = { timestamp: startDate, vote: OpenTestingVote.Neutral }
    }
    for (const message of gameData.chat) {
      if (
        post.openTesting.players && message.playerId in post.openTesting.players
          ? post.openTesting.players[message.playerId].timestamp < message.timestamp
          : gameData.players.includes(message.playerId)
      ) {
        const matches = /^([+-])1$/.exec(message.message)
        if (!matches) continue
        const vote: OpenTestingVote = matches[1] === '+' ? OpenTestingVote.Positive : OpenTestingVote.Negative
        updates[message.playerId] = { vote, timestamp: message.timestamp }
      }
    }

    const operations: Promise<void>[] = []
    if (Object.keys(updates).length) operations.push(this.realtimeDatabaseService.updateOpenTestingPlayers(postId, updates))
    if (!(post.openTesting.durations && gameNr in post.openTesting.durations))
      operations.push(this.realtimeDatabaseService.updateOpenTestingDurations(postId, gameNr, duration))
    if (operations.length) {
      const players = { ...post.openTesting.players, ...updates }
      const durations = { ...post.openTesting.durations, ...{ [gameNr]: duration } }
      const newPost = { ...post, openTesting: { ...post.openTesting, players, durations } }
      operations.push(this.chesscomService.editComment(post.link, post.responseId, generateResponseTemplate(newPost)).then(() => void 0))
      this.logger.debug('Updated OpenTesting response')
    }
    await Promise.all(operations)
    if (operations.length) return gameNr
  }

  private async removeGame(game: IOpenTestingGame) {
    this.games.splice(
      this.games.findIndex((g) => g.key === game.key),
      1,
    )
    await this.realtimeDatabaseService.removeOpenTestingGame(game.key)
  }
}

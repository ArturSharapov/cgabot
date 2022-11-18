/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common'
import * as moment from 'moment'
import parseHTML, { HTMLElement } from 'node-html-parser'
import { momentAgo } from 'src/functions'
import { BoardDrawerService } from 'src/modules/board-drawer/board-drawer.service'
import { ChesscomService } from 'src/modules/chesscom/chesscom.service'
import { RealtimeDatabaseService } from 'src/modules/database/realtime/realtime-database.service'
import { ImageHostingService } from 'src/modules/image-hosting/image-hosting.service'
import {
  FIXING_DURATION,
  MIN_FINAL_GAMES,
  MIN_GAMES,
  MIN_PLAYERS,
  MIN_SIMILARITY,
  MIN_TIMESPAN,
  NO_GAMES_MESSAGE,
  POSTS_LIMIT_MESSAGE,
  SKIP_COMMAND,
  TIME_RUN_OUT_MESSAGE,
} from '../config'
import { DEFAULT_POST } from '../posts/post.constants'
import {
  GameData,
  GameViolation,
  IGameResultData,
  IPost,
  IRequirements,
  IRequirementsDetails,
  IRequirementsGame,
  IRequirementsPosition,
  IRequirementsResult,
  PostStatus,
  PostType,
  STATUS_TEXT,
} from '../posts/post.interface'
import { gameRegex, generateFullTitle, parseFullTitle } from '../posts/posts.functions'
import { PostsService } from '../posts/posts.service'
import { generatePostTemplate } from '../templates/post-template'
import { generateResponseTemplate } from '../templates/response-template'
import { GAMERULES_NAMES } from './post-evaluation.constants'
import { generateGamerules, generatePromotion, generateRowFen } from './post-evaluation.functions'

@Injectable()
export class PostEvaluationService {
  private readonly logger = new Logger(PostEvaluationService.name)
  constructor(
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly chesscomService: ChesscomService,
    private readonly boardDrawerService: BoardDrawerService,
    private readonly imageHostingService: ImageHostingService,
    private readonly postsService: PostsService,
  ) {
    // Test games here:
    // this.evaluateGames([11922214,11922231,11922241,11922254,11931129,11942591,11942602,11942615,11942635], 'chesswhizz9')
  }

  // private async test() {
  //   const evaluation = await this.evaluateGames([10572990], 'chye4w')
  //   if (evaluation) {
  //     const koth = true //evaluation.requirements.position.gamerules.includes(GAMERULES_NAMES.koth)
  //     const deadWall = false //evaluation.requirements.position.gamerules.includes(GAMERULES_NAMES.deadWall)
  //     const racingKings = false //evaluation.requirements.position.gamerules.includes(GAMERULES_NAMES.racingKings)

  //     const image = this.boardDrawerService.draw(evaluation.requirements.position.fen, koth, deadWall, racingKings)
  //     const url = await this.imageHostingService.upload('Test', image)

  //     console.log(url)
  //   } else {
  //     this.logger.error(`Evaluation failed: no valid games`)
  //   }
  // }

  async evaluatePost(postId: string, post: IPost, body: HTMLElement) {
    if (post.editing) return false
    body.querySelector('.comment-post-body .reactions-multiple-contents')?.remove()
    const contentHTML = body.querySelector('.comment-post-component:first-child .comment-post-body')?.innerHTML.trim()
    if (!contentHTML || contentHTML.includes(SKIP_COMMAND)) return false
    if (
      (post.responseId && !body.querySelector(`#comment-${post.responseId}`)) ||
      (!post.responseId && body.querySelector(':is(.comment-post-avatar[title="CGA"] ~ .comment-post-body) > #response'))
    ) {
      const newResponseId = body
        .querySelector(':is(.comment-post-avatar[title="CGA"] ~ .comment-post-body) > #response')
        ?.parentNode?.parentNode?.id?.substring(8)
      if (newResponseId) await this.realtimeDatabaseService.updatePost(postId, 'responseId', newResponseId)
      this.logger.debug('Changing response ID')
      return false
    }
    const contentHash = contentHTML.hashCode()
    const fullTitle = body.querySelector('.post-category-header-title-v5')?.innerText.trim()
    const responseStatusText = post.responseId
      ? body.querySelector(`#comment-${post.responseId} #response-status`)?.innerText.trim() ?? STATUS_TEXT[PostStatus.Unknown]
      : STATUS_TEXT[PostStatus.Unknown]
    let responseMessage = post.responseId ? body.querySelector(`#comment-${post.responseId} #response-message`)?.innerHTML.trim() ?? '' : ''
    const locked = Boolean(body.querySelector('.v5-section-content-wide > strong'))
    const author = body.querySelector('.user-username-link')?.text.trim() ?? DEFAULT_POST.author
    const firstImage = body.querySelector('.comment-post-component:first-child .comment-post-body img')?.attrs.src

    const changes = {
      content: contentHash !== post.contentHash,
      title: fullTitle !== generateFullTitle(post.status, post.type, post.title),
      status: responseStatusText !== STATUS_TEXT[post.status],
      message: responseMessage !== post.message,
      locked: locked !== post.locked,
      author: author !== post.author,
      screenshot: firstImage !== post.screenshot,
    }

    const operations = []

    const isAnyChange = Object.values(changes).some(Boolean)

    // if (isAnyChange)
    //   console.log(
    //     post.title,
    //     ':',
    //     Object.keys(changes).filter((x: keyof typeof changes) => changes[x]),
    //   )
    if (!isAnyChange && (post.status < PostStatus.Unknown || post.type >= PostType.Other || locked)) {
      if (post.status === PostStatus.RNM && momentAgo(FIXING_DURATION) >= post.dateCreated && !locked) {
        // console.log('TIME_RUN_OUT_MESSAGE')
        const status = PostStatus.Declined
        const responseMessage = TIME_RUN_OUT_MESSAGE
        operations.push(this.editResponse(postId, post.link, post.responseId, generateResponseTemplate({ status, type: post.type, message: responseMessage })))
        operations.push(this.realtimeDatabaseService.updatePost(postId, 'status', status))
        operations.push(this.realtimeDatabaseService.updatePost(postId, 'message', responseMessage))
      }
      await Promise.all(operations)
      return false
    }

    let shouldLock = false
    let { type, title } = changes.title && fullTitle ? parseFullTitle(fullTitle) : post
    let status = post.status
    let newContent = ''
    const importantTypeChange = (post.type >= PostType.Other && type < PostType.Other) || (type >= PostType.Other && post.type < PostType.Other)

    if (changes.status) {
      const newStatus = (STATUS_TEXT as unknown as string[]).indexOf(responseStatusText)
      status = ~newStatus ? newStatus : PostStatus.Unknown
    }
    const doesComplyLimit = !(status === PostStatus.Unknown && type < PostType.Other && !this.postsService.doesComplyLimit(author, postId))
    if (changes.author) {
      operations.push(this.realtimeDatabaseService.updatePost(postId, 'author', author))
    }
    if (changes.locked) {
      operations.push(this.realtimeDatabaseService.updatePost(postId, 'locked', locked))
    }
    if (changes.title) {
      if (post.title !== title) operations.push(this.realtimeDatabaseService.updatePost(postId, 'title', title))
      if (post.type !== type) operations.push(this.realtimeDatabaseService.updatePost(postId, 'type', type))
    }
    if (doesComplyLimit && (changes.content || importantTypeChange || status === PostStatus.Unknown)) {
      if (type < PostType.Other) {
        const { games: gameNrs, note } = this.parseContent(body)
        if (
          !locked &&
          status >= PostStatus.RNM &&
          (!post.requirements ||
            !Object.areEqual(gameNrs, post.requirements.games?.map((game) => game.gameNr) ?? []) ||
            importantTypeChange ||
            status === PostStatus.Unknown)
        ) {
          const gamesEvaluation = await this.evaluateGames(gameNrs, author)
          if (gamesEvaluation) {
            const { newStatus, requirements } = gamesEvaluation
            if (status !== newStatus || !post.requirements || !Object.areEqual(requirements, post.requirements)) {
              status = newStatus
              // Open Testing here
              operations.push(
                this.editResponse(postId, post.link, post.responseId, generateResponseTemplate({ status, type, requirements, message: responseMessage })),
              )
              // console.log('response updated')
            }
            operations.push(this.realtimeDatabaseService.updatePost(postId, 'requirements', requirements))
            let screenshot = post.screenshot ?? ''
            if (post.requirements?.position.fen !== requirements.position.fen || post.requirements.position.gamerules !== requirements.position.gamerules) {
              const koth = requirements.position.gamerules.includes(GAMERULES_NAMES.koth)
              const deadWall = requirements.position.gamerules.includes(GAMERULES_NAMES.deadWall)
              const racingKings = requirements.position.gamerules.includes(GAMERULES_NAMES.racingKings)
              const image = this.boardDrawerService.draw(requirements.position.fen, koth, deadWall, racingKings)
              screenshot = await this.imageHostingService.upload(title, image)
            }
            newContent = generatePostTemplate(screenshot, requirements, note)
          } else {
            status = PostStatus.Declined
            shouldLock = true
            responseMessage = NO_GAMES_MESSAGE
            operations.push(this.editResponse(postId, post.link, post.responseId, generateResponseTemplate({ status, type, message: responseMessage })))
          }
        } else if (changes.content && post.requirements && post.screenshot) newContent = generatePostTemplate(post.screenshot, post.requirements, note)
        else if (!post.requirements) this.logger.error(`NEVER Requirements is undefined`)
        else if (!post.screenshot) this.logger.error(`NEVER Screenshot is undefined`)
      } else {
        if (!locked)
          operations.push(this.editResponse(postId, post.link, post.responseId, generateResponseTemplate({ status, type, message: responseMessage })))
      }
    }
    if (!doesComplyLimit && !locked) {
      // console.log('POSTS_LIMIT_MESSAGE')
      status = PostStatus.Declined
      responseMessage = POSTS_LIMIT_MESSAGE
      operations.push(this.editResponse(postId, post.link, post.responseId, generateResponseTemplate({ status, type, message: responseMessage })))
    }

    if (status !== post.status) {
      operations.push(this.realtimeDatabaseService.updatePost(postId, 'status', status))
    }
    if (responseMessage !== post.message) {
      operations.push(this.realtimeDatabaseService.updatePost(postId, 'message', responseMessage))
    }

    const newFullTitle = generateFullTitle(status, type, title)

    if (newContent) {
      const { body: resultContent } = await this.chesscomService.editPost(post.link, newFullTitle, newContent)
      if (resultContent) {
        const screenshot = parseHTML(resultContent)?.querySelector('#screenshot')?.attrs.src ?? firstImage ?? null
        const resultContentHash = resultContent.hashCode()
        if (post.screenshot !== screenshot) {
          operations.push(this.realtimeDatabaseService.updatePost(postId, 'screenshot', screenshot))
        }
        if (post.contentHash !== resultContentHash) operations.push(this.realtimeDatabaseService.updatePost(postId, 'contentHash', resultContentHash))
        // console.log('post updated')
      } else {
        this.logger.error('resultContent is not found')
        return
      }
    } else {
      if (changes.content) {
        operations.push(this.realtimeDatabaseService.updatePost(postId, 'contentHash', contentHash))
      }
      if (newFullTitle !== fullTitle) {
        this.chesscomService.editPostTitle(post.link, newFullTitle)
      }
      if (type >= PostType.Other && firstImage !== post.screenshot) {
        operations.push(this.realtimeDatabaseService.updatePost(postId, 'screenshot', firstImage ?? null))
      }
    }

    await Promise.all(operations)
    if (shouldLock) await this.chesscomService.lockPost(post.link, true)
    return true
  }

  private async editResponse(postId: string, postLink: string, responseId: string, message: string) {
    if (responseId) return await this.chesscomService.editComment(postLink, responseId, message)
    else {
      const { newCommentId } = await this.chesscomService.editComment(postLink, responseId, message)
      return await this.realtimeDatabaseService.updatePost(postId, 'responseId', newCommentId)
    }
  }

  private parseContent(body: HTMLElement) {
    const links = body.querySelectorAll('.comment-post-component:first-child .comment-post-body a').map((x) => x.attrs['href'])
    const games: number[] = []
    for (const i in links) {
      const exec = gameRegex.exec(links[i])
      if (exec && !games.includes(+exec[2])) games.push(+exec[2])
    }

    for (const x of body.querySelectorAll('#timecontrol, #gamerules, #promotion, #note-header, .comment-post-component:first-child .comment-post-body a'))
      (!x.attrs['href'] || gameRegex.test(x.attrs['href'])) && x.remove()
    const note =
      body
        .querySelector('.comment-post-component:first-child .comment-post-body')
        ?.structuredText.split('\n')
        .filter(Boolean)
        .map((x) => x.trim())
        .join('\n') ?? ''
    return { note, games }
  }

  private async evaluateGames(gamesNrs: number[], author: string): Promise<{ requirements: IRequirements; newStatus: PostStatus } | undefined> {
    const info: { [gameNr: number]: { violations: GameViolation[]; final: boolean } } = {}
    const players: string[] = []
    const games: { [gameNr: number]: IGameResultData } = {}

    await Promise.all(
      gamesNrs.map(async (gameNr) => {
        const game = await this.getGameResultData(gameNr)
        if (!game || !game.fen) return
        const violations: GameViolation[] = []
        if (game.aborted) violations.push(GameViolation.Aborted)
        if (game.hasBot) violations.push(GameViolation.HasBot)
        if (!game.players.includes(author)) violations.push(GameViolation.NoAuthor)
        info[gameNr] = { violations, final: false }
        games[gameNr] = game
      }),
    )

    const sortedGameNrs = Object.keys(info).sort((a, b) => info[+b].violations.length - info[+a].violations.length || +a - +b)

    if (!Object.keys(games).length) return
    const finalRowFen = generateRowFen(games[+sortedGameNrs.last].fen)
    let firstGameNr: string | undefined

    for (let i = sortedGameNrs.length - 1; i >= 0 && !info[+sortedGameNrs[i]].violations.length; i--) {
      for (const player of games[+sortedGameNrs[i]].players) if (!players.includes(player)) players.push(player)
      const final = (['fen', 'gamerules', 'promotion', 'timeControl'] as const).every(
        (property) => games[+sortedGameNrs[i]][property] === games[+sortedGameNrs.last][property],
      )
      info[+sortedGameNrs[i]].final = final
      if (!final && finalRowFen.similarity(generateRowFen(games[+sortedGameNrs[i]].fen)) < MIN_SIMILARITY)
        info[+sortedGameNrs[i]].violations.push(GameViolation.NotSimilar)
      else firstGameNr = sortedGameNrs[i]
    }

    const finalSortedGameNrs = sortedGameNrs
      .sort((a, b) =>
        info[+b].final === info[+a].final ? info[+b].violations.length - info[+a].violations.length || +a - +b : info[+b].final && !info[+a].final ? -1 : 1,
      )
      .slice(-MIN_GAMES)

    if (firstGameNr && !finalSortedGameNrs.includes(firstGameNr)) finalSortedGameNrs[0] = firstGameNr

    const sorted: IRequirementsGame[] = []
    for (const gameNr of finalSortedGameNrs)
      sorted.push(info[+gameNr].violations.length ? { gameNr: +gameNr, ...info[+gameNr] } : { gameNr: +gameNr, final: info[+gameNr].final })

    const timespan = !firstGameNr || firstGameNr === finalSortedGameNrs.last ? 0 : moment(games[+finalSortedGameNrs.last].date).diff(games[+firstGameNr].date)

    // console.log('players.length:', players.length)
    // console.log(sorted)
    // console.log('timespan:', timespan)

    // 0 1 2 3 4 5 6 7 8 9

    const details: IRequirementsDetails = {
      valid: firstGameNr ? sorted.length - finalSortedGameNrs.indexOf(firstGameNr) : 0,
      games: sorted.length,
      final: sorted.length - sorted.findIndex((game) => game.final),
      players: players.length,
      timespan: timespan,
    }

    const result: IRequirementsResult = {
      valid: details.valid === MIN_GAMES,
      games: details.games === MIN_GAMES,
      final: details.final >= MIN_FINAL_GAMES,
      players: details.players >= MIN_PLAYERS,
      timespan: !details.timespan || details.timespan >= MIN_TIMESPAN,
    }

    const position: IRequirementsPosition = {
      fen: games[sorted.last.gameNr].fen,
      gamerules: games[sorted.last.gameNr].gamerules,
      promotion: games[sorted.last.gameNr].promotion,
      timeControl: games[sorted.last.gameNr].timeControl,
      other: JSON.stringify(games[sorted.last.gameNr].openTestingData),
    }

    const requirements: IRequirements = { details, result, games: sorted, position }
    const newStatus = Object.values(requirements.result).every(Boolean) ? PostStatus.UR : PostStatus.RNM

    return { requirements, newStatus }
  }

  private async getGameResultData(gameNr: number): Promise<IGameResultData | undefined> {
    const getGameData = this.realtimeDatabaseService
      .receiveMessage<'not_found' | 'not_finished' | GameData>(
        `x => (x.mutation === 'game_not_found' && x.data === ${gameNr}) || ((x.mutation === 'live_game' || x.mutation === 'archive_game') && x.data.gameNr === ${gameNr})`,
        `x => {
          if (x.mutation === 'game_not_found') return 'not_found'
          if (x.mutation === 'live_game') return 'not_finished'
          const players = x.data.q.existingSeats.map(i => x.data[\`username\${i+1}\`])
          const startDate = x.data.date
          const endDate = x.data.pgn4.match(/date=([\\d:.ZT-]+) clock=\\d+ \\} $/)[1]
          const { startFen: fen, timeControl, ruleVariants: gamerules, typeName: type, pieceAlts } = x.data.q
          const pure2Player = x.data.q.numRequired === 2 && !x.data.q.numZombies
          if (!gamerules.play4mate && pure2Player) gamerules.gameOfPoints = true
          else if (pure2Player) gamerules.play4mate = false
          const aborted = x.data.result === 'Aborted'
          const hasBot = [1,2,3,4].some(i => x.data[\`isBot\${i}\`])
          const openTestingData = {}
          for (const key of ['gameType', 'timeControlInitial', 'increment', 'isDelay', 'ruleVariants', 'startFen', 'whiteBlack', 'numRequired', 'numZombies', 'existingSeats', 'twoPlayer', 'fairyPiecesExist', 'twoPlayerWhiteVsBlack', 'type', 'grasshoppersExist', 'timeControl', 'typeName', 'timeControlType', 'pieceAlts'])
            openTestingData[key] = x.data.q[key]
          return { players, startDate, endDate, fen: fen ?? '', timeControl, gamerules, type, aborted, hasBot, pieceAlts, openTestingData }
        }`,
      )
      .get()
    this.realtimeDatabaseService.sendMessage('game', { action: 'join', gameNr })
    const { body: gameData } = await getGameData
    if (!gameData || gameData === 'not_found' || gameData === 'not_finished') return
    const gamerules = generateGamerules(gameData)
    const promotion = generatePromotion(gameData)
    const date = moment(gameData.startDate).valueOf()
    const { timeControl, fen, players, aborted, hasBot, openTestingData } = gameData
    return { gamerules, promotion, timeControl, fen, players, date, aborted, hasBot, openTestingData }
  }
}

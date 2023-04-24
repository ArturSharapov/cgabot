/* eslint-disable prettier/prettier */
import { formatDuration } from 'src/functions'
import { IOpenTesting, IOpenTestingPlayers, OpenTestingStatus, OpenTestingVote } from '../open-testing/open-testing.interface'
import { GameViolation, IRequirements, PostStatus, PostType, STATUS_TEXT } from '../posts/post.interface'

export const generateResponseTemplate = (post: {
  status: PostStatus
  type: PostType
  message: string
  requirements?: IRequirements
  openTesting?: IOpenTesting
}) => {
  // console.log('status:', post.status, '| type:', PostType[post.type], '| message:', post.message, '| requirements:', !!post.requirements)
  if (post.type === PostType.Other && post.status >= PostStatus.RNM)
    return `
      <div class="fquote" id="response" style="padding:15px 20px;border-bottom: 3px solid #333333;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
        <p style="font-weight:600;margin: 17px 0 0 55px;color:#eaeaea;font-family:inherit;font-size:16px;">
          <span style="color:#999;">This forum thread has been identified by <a href="cgabot-3-0" style="color: inherit;">cgabot</a> as a discussion topic.</span>
        </p>
        <div style="margin-top:10px;line-height:0;"></div>
      </div>`
  switch (post.status) {
    case post.requirements ? PostStatus.UR : -1: {
      if (!post.openTesting)
        return `
      <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #4291e2;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
        <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
        <p style="font-weight:600;margin:-60px 0 0 75px;color: #dbe4ed;font-family:inherit;font-size:16px;">Status: <a style="color: #539de9;" target="_blank" rel="noopener" id="response-status">${
          STATUS_TEXT[post.status]
        }</a></p>
        <p style="font-weight:600;margin: 11px 0 10px 80px;color:#eaeaea;font-family:inherit;font-size: 12px;color: #539de9;">
          <span style="padding:0 5px;">${OPEN_TESTING_MESSAGE[OpenTestingStatus.Off]}</span>
        </p>
      </div>`

      const { duration, games } = evaluateDuration(post.openTesting.durations)
      const { players, positive, negative } = evaluatePlayers(post.openTesting.players)

      return `
      <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #4291e2;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
        <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
        <p style="font-weight:600;margin:-60px 0 0 75px;color: #dbe4ed;font-family:inherit;font-size:16px;">Status: <a style="color: #539de9;" target="_blank" rel="noopener" id="response-status">${
          STATUS_TEXT[post.status]
        }</a></p>
        <p style="font-weight:600;color: #dbe4ed;font-size:12px;text-align: right;margin-top: -28px;margin-left: 230px;">
          <span style="padding: 0 10px;white-space: nowrap;"><span style="font-family:'Chess V3';font-size: 18px;font-weight: 400;padding-right: 4px;">Θ</span><span style="color:#539de9;">${games}</span></span>
          <span style="padding: 0 10px;white-space: nowrap;"><span style="font-family:'Chess V3';font-size: 18px;font-weight: 400;padding-right: 4px;">n</span><span style="color:#539de9;">${players}</span></span>
          <span style="padding: 0 10px;white-space: nowrap;"><span style="font-family:'Chess V3';font-size: 18px;font-weight: 400;padding-right: 4px;">Ἓ</span><span style="color:#539de9;">${duration}</span></span>
          <span style="padding: 0 10px;white-space: nowrap;"><span style="font-family:'Chess V3';font-size: 18px;font-weight: 400;padding-right: 4px;">ὧ</span><span style="color:#539de9;">+${positive}</span><span style="color: #539de9;font-size: 9px;padding: 0 3px;">vs</span><span style="color: #539de9;">-${negative}</span></span>
        </p>
        <p style="font-weight:600;margin: 11px 0 10px 80px;color:#eaeaea;font-family:inherit;font-size: 12px;color: #539de9;">
          <span style="padding:0 5px;">${OPEN_TESTING_MESSAGE[post.openTesting.status]}</span>
        </p>
      </div>`
    }
    case post.requirements ? PostStatus.RNM : -1: {
      if (!post.requirements) throw new Error('PostStatus is -1')
      const { result: r, details: d } = post.requirements
      return `
        <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #e242c8;font-family:'Segoe UI', system-ui;margin:-25px 0px -10px -65px;background:#333;">
          <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
          <p style="font-weight:600;margin:-60px 0 0 75px;color: #f1e2ef;font-family:inherit;font-size:16px;">Status: <a style="color:#e242c8;" target="_blank" rel="noopener" id="response-status" href="requirements-for-submission">${
            STATUS_TEXT[post.status]
          }<br></a></p>
          <div style="margin:11px 20px 0px 75px;margin-bottom: 10px;">
            ${
              r.games
                ? ''
                : `<p style="font-weight:600;color: #f1e2ef;font-family:inherit;font-size:12px;margin:1px 0"><span style="padding:0 3px;">There are only <span style="color: #e242c8;">${d.games}</span> games.</span></p>`
            }
            ${
              r.final
                ? ''
                : `<p style="font-weight:600;color: #f1e2ef;font-family:inherit;font-size:12px;margin:1px 0"><span style="padding:0 3px;">There are only <span style="color: #e242c8;">${d.final}</span> games of the final version.</span></p>`
            }
            ${
              r.players
                ? ''
                : `<p style="font-weight:600;color: #f1e2ef;font-family:inherit;font-size:12px;margin:1px 0"><span style="padding:0 3px;">There are only <span style="color: #e242c8;">${d.players}</span> unique players.</span></p>`
            }
            ${
              r.timespan
                ? ''
                : `<p style="font-weight:600;color: #f1e2ef;font-family:inherit;font-size:12px;margin:1px 0"><span style="padding:0 3px;">The games are played over a span of only <span style="color: #e242c8;">${formatDuration(
                    d.timespan,
                  )}</span>.</span></p>`
            }
            ${
              post.requirements.games
                ?.map(
                  (game, gameIndex) =>
                    game.violations
                      ?.map(
                        (violation) =>
                          `<p style="font-weight:600;color: #f1e2ef;font-family:inherit;font-size:12px;margin:1px 0"><span style="padding:0 3px;">${ViolationMessage[
                            violation
                          ](gameIndex)}</span></p>`,
                      )
                      .join('') ?? '',
                )
                .join('') ?? ''
            }
          </div>
        </div>`
    }
    case PostStatus.Pending:
      return `
        <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #d29f2c;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
          <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
          <p style="font-weight:600;margin:-60px 0 0 75px;color:#eaeaea;font-family:inherit;font-size:16px;">Status: <span style="color:#d29f2c;" id="response-status">${
            STATUS_TEXT[post.status]
          }</span></p>
          <p style="font-weight:600;margin:11px 0 0px 80px;color:#eaeaea;font-family:inherit;font-size:12px;">
            <span>Suggestion: <span style="color:#d29f2c;" id="response-message">${post.message || ' – '}</span></span>
          </p>
          <div style="margin-top:10px;line-height:0;"></div>
        </div>`
    case PostStatus.Accepted:
      return `
        <div class="fquote" id="response" style="padding:15px 20px;border-bottom: 3px solid #56a741;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
          <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
          <p style="font-weight:600;margin:-60px 0 0 75px;color:#eaeaea;font-family:inherit;font-size:16px;">Status: <span style="color: #56a741;" id="response-status">${
            STATUS_TEXT[post.status]
          }</span></p>
          <p style="font-weight:600;margin:11px 0 0px 80px;color:#eaeaea;font-family:inherit;font-size:12px;">
            <span>Reason: <span style="color: #56a741;" id="response-message">${post.message || ' – '}</span></span>
          </p>
          <div style="margin-top:10px;line-height:0;"></div>
        </div>`
    case PostStatus.Declined:
      return `
        <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #e24242;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
          <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
          <p style="font-weight:600;margin:-60px 0 0 75px;color:#eaeaea;font-family:inherit;font-size:16px;">Status: <span style="color:#e24242;" id="response-status">${
            STATUS_TEXT[post.status]
          }</span></p>
          <p style="font-weight:600;margin:11px 0 0px 80px;color:#eaeaea;font-family:inherit;font-size:12px;">
            <span>Reason: <span style="color:#e24242;" id="response-message">${post.message || ' – '}</span></span>
          </p>
          <div style="margin-top:10px;line-height:0;"></div>
        </div>`
    case PostStatus.Unknown:
      return `<div class="fquote" id="response" style="padding: 53px 20px;font-family:'Segoe UI', system-ui;margin: -38px 0px -10px -65px;background: #272522;"></div>`
    default:
      return `<div class="fquote" id="response" style="padding: 53px 20px;font-family:'Segoe UI', system-ui;margin: -38px 0px -10px -65px;background: #272522;"></div>`
  }
}

const ViolationMessage: { [violation in GameViolation]: (gameIndex: number) => string } = {
  [GameViolation.NoAuthor]: (gameIndex: number) =>
    `The game <span style="color: #e242c8;">#${gameIndex + 1}</span> is played without the author of the position.`,
  [GameViolation.NotSimilar]: (gameIndex: number) =>
    `The position of the game <span style="color: #e242c8;">#${gameIndex + 1}</span> is not similar to the final version.`,
  [GameViolation.HasBot]: (gameIndex: number) => `The game <span style="color: #e242c8;">#${gameIndex + 1}</span> is played with a bot player.`,
  [GameViolation.Aborted]: (gameIndex: number) => `The game <span style="color: #e242c8;">#${gameIndex + 1}</span> is aborted.`,
}

const OPEN_TESTING_MESSAGE: { [status in OpenTestingStatus]: string } = {
  [OpenTestingStatus.On]: 'The Open Testing has been started! Join to try out the new position and evaluate it yourself!',
  [OpenTestingStatus.Off]: 'The Open Testing is not available for this position.',
  [OpenTestingStatus.Finished]: 'The Open Testing is over.',
}

const evaluateDuration = (durations: { [gameNr: number]: number }) => {
  let sum = 0,
    count = 0
  for (const gameNr in durations) {
    sum += durations[+gameNr]
    count++
  }
  const average = count && sum / count
  const minutes = Math.trunc(average / 1e3 / 60)
  const seconds = Math.trunc((average / 1e3) % 60)
  const duration = (minutes ? minutes + 'm ' : '') + (seconds + 's')
  return { games: count, duration }
}

const evaluatePlayers = (players: IOpenTestingPlayers) => {
  let count = 0,
    positive = 0,
    negative = 0
  for (const playerId in players) {
    if (players[+playerId].vote === OpenTestingVote.Positive) positive++
    else if (players[+playerId].vote === OpenTestingVote.Negative) negative++
    count++
  }
  return { players: count, positive, negative }
}

// <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #4291e2;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
//   <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
//   <p style="font-weight:600;margin:-60px 0 0 75px;color:#eaeaea;font-family:inherit;font-size:16px;">Status: <span style="color:#4291e2;" id="response-status">Under Review</span></p>
//   <p style="font-weight:600;margin: 8px 0 0px 75px;color:#eaeaea;font-family:inherit;font-size:12px;/* color: #4291e2; */">
//     <span style="padding:0 5px;">The <a style="color: inherit;">Open Testing</a> has already started! Join to try out and evaluate the new position yourself!</span>

//   </p><p style="font-weight:600;margin: 5px 0 -2px 75px;color:#eaeaea;font-family:inherit;font-size:12px;">
//     <span style="padding:0 5px;">Games: <span style="color:#4291e2;">23</span></span>
//     <span style="padding:0 5px;">Players: <span style="color:#4291e2;">7</span></span>
//     <span style="padding:0 5px;">Votes: <span style="color:#4291e2;">+3 / -2</span></span>
//   </p>
//   <div style="margin-top:10px;line-height: 0;"></div>
// </div>

// <div style="width:100%;text-align:center;padding-top:0px;padding-bottom:28px;"><a style="color:#eaeaea;text-decoration:none;background-color: #211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10573375-0">&nbsp;1&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color: #211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572459-0">&nbsp;2&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572525-0">&nbsp;3&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10482623-0">&nbsp;4&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10495700-0">&nbsp;5&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10515949-0">&nbsp;6&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572601-0">&nbsp;7&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572742-0">&nbsp;8&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572872-0">&nbsp;9&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572990-0">10</a></div>

//old UR response:
// <div class="fquote" id="response" style="padding:15px 20px;border-bottom:3px solid #4291e2;font-family:'Segoe UI', system-ui;margin:-31px 0px -10px -65px;background:#333;">
//   <img style="width:60px;margin:7px 0 0 -40px;" src="https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/qilp/phpJSLljr.png">
//   <p style="font-weight:600;margin:-60px 0 0 75px;color:#eaeaea;font-family:inherit;font-size:16px;">Status: <span style="color:#4291e2;" id="response-status">Under Review</span></p>
//   <p style="font-weight:600;margin:11px 0 0px 75px;color:#eaeaea;font-family:inherit;font-size:12px;">
//     <span style="padding:0 5px;">Games: <span style="color:#4291e2;">${post.requirements.details.games}/10</span></span>
//     <span style="padding:0 5px;">Timespan: <span style="color:#4291e2;">${Math.trunc(post.requirements.details.timespan / 60)}/24</span></span>
//     <span style="padding:0 5px;">Players: <span style="color:#4291e2;">${post.requirements.details.players?.length ?? 0}/8</span></span>
//   </p>
//   <div style="margin-top:10px;line-height: 0;"></div>
// </div>

// NEW POST STYLES:

// <div style="padding:0;/* margin-right: 65px; */">
// <div style="background-color: #272522;"><img id="screenshot" style="margin:0 auto;padding:37px;" class="" src="https://images.chesscomfiles.com/proxy/i.ibb.co/8MV3tm7/ncp/https/c1f1c1c728.png" data-src="https://images.chesscomfiles.com/proxy/i.ibb.co/8MV3tm7/ncp/https/c1f1c1c728.png" alt="Screenshot" height="523">
// <div style="width:100%;text-align:center;padding-top:0px;padding-bottom:28px;"><a style="color:#eaeaea;text-decoration:none;background-color: #211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10573375-0">&nbsp;1&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color: #211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572459-0">&nbsp;2&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572525-0">&nbsp;3&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10482623-0">&nbsp;4&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10495700-0">&nbsp;5&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10515949-0">&nbsp;6&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572601-0">&nbsp;7&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572742-0">&nbsp;8&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572872-0">&nbsp;9&nbsp;</a> <a style="color:#eaeaea;text-decoration:none;background-color:#211f1c;padding:6px 14px;margin:2px auto;width:15px;border:1px solid #1e1c1a;" href="https://www.chess.com/4-player-chess?g=10572990-0">10</a></div>
// </div>
// <div style="background-color: #211f1c;padding:20px;color:#ccd4de;border: 1px solid #1e1c1a;">
// <div id="timecontrol" style="padding-bottom:16px;">
// <p style="color:#8f8f8f;">Timecontrol</p>
// 2|3</div>
// <div id="gamerules" style="padding-top:16px;border-top:#333 solid 1px;padding-bottom:20px;">
// <p style="color:#8f8f8f;">Gamerules</p>
// Anonymous, King of the Hill, Capture the King, 5-7-check</div>
// <div id="promotion" style="padding-top:16px;border-top:#333 solid 1px;padding-bottom:20px;">
// <p style="color:#8f8f8f;">Promotion</p>
// Knight, Grasshopper, Knight on the 4th rank</div>
// <div style="padding-top:16px;border-top:#333 solid 1px;">
// <div id="note-header">
// <p style="color:#8f8f8f;">Note</p>
// </div>
// The initial concept and idea belong to JkCheeseChess.</div>
// </div>
// </div>

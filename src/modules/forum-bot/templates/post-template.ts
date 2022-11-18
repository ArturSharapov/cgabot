/* eslint-disable prettier/prettier */

import { GameViolation, IRequirements } from "../posts/post.interface";

export const generatePostTemplate = (screenshot: string, requirements: IRequirements, note: string) => {
  return `
    <div style="padding:0;">
      <div style="background-color: #272522;">
        <img id="screenshot" src="${screenshot}" style="margin:0 auto;padding:26px 37px;" alt="Screenshot" height="523">
        <div style="width:100%;text-align:center;padding-top:0px;padding-bottom:28px;">
          ${requirements.games?.map((game, gameIndex) => `
            <a href="https://www.chess.com/variants/custom/game/${game.gameNr}" target="_blank" rel="noopener"
            title="${game.violations ? game.violations.map(violation => ViolationMessage[violation]).join('\n') : game.final ? '' : FinalMessage}"
            style="
              color: ${game.violations ? '#c5bbbb' : game.final ? '#eaeaea' : '#8f8f8f'};
              background-color: ${game.violations ? '#291414' : '#211f1c'};
              border: 1px solid ${game.violations ? '#261212' : '#1e1c1a'};
              text-decoration: none;padding: 5px 12px;margin: 2px auto;width: 15px;
            " >${gameIndex<9 ? `&nbsp;${gameIndex+1}&nbsp;` : gameIndex+1 }</a>
          `).join('')}
        </div>
      </div>
      <div style="background-color: #211f1c;padding:20px;color:#ccd4de;border: 1px solid #1e1c1a;">
        <div id="timecontrol" style="padding-bottom:16px;">
          <p style="color:#8f8f8f;">Timecontrol</p>
          ${requirements.position.timeControl || ' '}
        </div>
        ${requirements.position.gamerules && 
          `<div id="gamerules" style="padding-top:16px;border-top:#333 solid 1px;padding-bottom:20px;">
            <p style="color:#8f8f8f;">Gamerules</p>
            ${requirements.position.gamerules}  
          </div>
        `}
        <div id="promotion" style="padding-top:16px;border-top:#333 solid 1px;${note ? `padding-bottom:20px;` : ''}">
          <p style="color:#8f8f8f;">Promotion</p>
          ${requirements.position.promotion || ' '}
        </div>
        ${note ? `<div style="padding-top:16px;border-top:#333 solid 1px;">
          <div id="note-header">
            <p style="color:#8f8f8f;">Note</p>
          </div>
          ${note}
        </div>` : ''}
      </div>
    </div>
    `
}

const ViolationMessage: {[violation in GameViolation]: string} = {
  [GameViolation.NoAuthor]: `The game is played without the author of the position.`,
  [GameViolation.NotSimilar]: `The position of the game is not similar to the final version.`,
  [GameViolation.HasBot]: `The game is played with a bot player.`,
  [GameViolation.Aborted]: `The game is aborted.`,
}
const FinalMessage = `The game is not of the final version.`
import { DEFAULT_POST } from './post.constants'
import { PostStatus, PostType, STATUS_ICONS } from './post.interface'

export const generateFullTitle = (status: PostStatus, type: PostType, value: string) => {
  if (type >= PostType.Other) return value
  // eslint-disable-next-line no-irregular-whitespace
  return `${STATUS_ICONS[status]} ${PostType[type]} ︱ ${value || DEFAULT_POST.title}`.trim()
}

export const gameRegex = /^https:\/\/www.chess.com\/variants\/(.+\/)?game\/([1-9][0-9]*)/

export const parseFullTitle = (fullTitle: string) => {
  const matches = /^(.)?\s?((NCV)|(WOF))\s*(-|:|—|–|︱|\|)\s*(.*)/i.exec(fullTitle)
  if (matches && !matches[6]) console.log(matches, fullTitle)
  if (!matches)
    return {
      status: PostStatus.Unknown,
      type: PostType.Other,
      title: fullTitle,
    }
  const status = (STATUS_ICONS as unknown as string[]).indexOf(matches[1])
  const type = matches[3] ? PostType.NCV : matches[4] ? PostType.WoF : PostType.Other
  const title = matches[6]

  return {
    status: ~status ? (status as PostStatus) : PostStatus.Unknown,
    type: type,
    title: title,
  }
}

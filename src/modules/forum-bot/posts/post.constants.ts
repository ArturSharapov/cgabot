import { IPost, PostStatus, PostType } from './post.interface'

export const DEFAULT_POST: IPost = {
  dateCreated: 0,
  dateUpdated: 0,
  contentHash: 0,
  message: '',
  status: PostStatus.Unknown,
  author: 'unknown',
  link: '',
  type: PostType.Other,
  title: 'Unnamed',
  locked: false,
  responseId: '',
}

import { OpenTestingStatus } from '../open-testing/open-testing.interface'
import { PostStatus, PostType } from '../posts/post.interface'

export enum PostEditType {
  Type,
  Title,
  Locked,
  Status,
  Message,
  OpenTestingStatus,
  Notes,
  PrimaryReviewer,
  AssistantReviewers,
  ConfirmDelete,
}

export interface IPostEdit {
  type: PostEditType
  value: any
  userId: string
  postId: string
  success?: boolean
}

export function isForumPostEditType(postEditType: PostEditType) {
  return [PostEditType.Type, PostEditType.Title, PostEditType.Locked, PostEditType.Status, PostEditType.Message, PostEditType.OpenTestingStatus].includes(
    postEditType,
  )
}

export function isPostEdit(postEdit: any): postEdit is IPostEdit {
  return (
    typeof postEdit.type === 'number' &&
    /^[0-9]$/.test(String(postEdit.type as PostEditType)) &&
    typeof postEdit.userId === 'string' &&
    typeof postEdit.postId === 'string' &&
    (typeof postEdit.success === 'boolean' || typeof postEdit.success === 'undefined') &&
    ((postEdit.type === PostEditType.Type && /^[0-2]$/.test(String(postEdit.value as PostType))) ||
      (postEdit.type === PostEditType.Title && typeof postEdit.value === 'string') ||
      (postEdit.type === PostEditType.Locked && typeof postEdit.value === 'boolean') ||
      (postEdit.type === PostEditType.Status && /^[0-5]$/.test(String(postEdit.value as PostStatus))) ||
      (postEdit.type === PostEditType.Message && typeof postEdit.value === 'string') ||
      (postEdit.type === PostEditType.OpenTestingStatus && /^[0-2]$/.test(String(postEdit.value as OpenTestingStatus))) ||
      (postEdit.type === PostEditType.Notes && typeof postEdit.value === 'string') ||
      (postEdit.type === PostEditType.PrimaryReviewer && typeof postEdit.value === 'string') ||
      (postEdit.type === PostEditType.AssistantReviewers && typeof postEdit.value === 'string') ||
      (postEdit.type === PostEditType.ConfirmDelete && typeof postEdit.value === 'boolean'))
  )
}

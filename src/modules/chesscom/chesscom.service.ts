import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosRequestConfig } from 'axios'
import { scripts } from './chesscom.scripts'

@Injectable()
export class ChesscomService {
  private readonly logger = new Logger(ChesscomService.name)
  constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

  readonly #token = this.configService.get<string>('CHESSCOM_API_TOKEN')

  private axios<T>(method: 'get' | 'post', url: string, config?: AxiosRequestConfig) {
    return new Promise<T>((resolve) => {
      this.httpService[method](url, config).subscribe({
        next(value) {
          resolve(value.data)
        },
        error: async () => {
          this.logger.error('chesscom-api is not available')
        },
      })
    })
  }

  private evaluate<T>(expression: string, isFunction = false) {
    return this.axios<T>('get', isFunction ? 'evaluate-function' : 'evaluate', { data: { token: this.#token, expression } })
  }

  async getGame(gameNr: number) {
    return await this.axios('get', `/game/${gameNr}`, { data: { token: this.#token } })
  }

  async editPost(postLink: string, newTitle: string, newContent: string) {
    const [result, body] = await this.evaluate<[boolean, string]>(scripts.editPost(postLink, newTitle, newContent))
    if (!result) this.logger.error(`Unable to edit the post (${postLink})`)
    return { result: result, body }
  }

  async editPostTitle(postLink: string, newTitle: string) {
    const [result] = await this.evaluate<[boolean, string]>(scripts.editPost(postLink, newTitle, ''))
    if (!result) this.logger.error(`Unable to edit the post title (${postLink})`)
    return result
  }

  async editPostContent(postLink: string, newContent: string) {
    const [result] = await this.evaluate<[boolean, string]>(scripts.editPost(postLink, '', newContent))
    if (!result) this.logger.error(`Unable to edit the post content (${postLink})`)
    return result
  }

  async editComment(postLink: string, commentId: string, content: string) {
    const [result, newCommentId] = await this.evaluate<[boolean, string | '']>(scripts.editComment(postLink, commentId, content))
    if (!result || !newCommentId || newCommentId === 'undefined') {
      this.logger.error(`Unable to edit the post comment (${postLink}#comment-${commentId})`)
      return { result: false, newCommentId: commentId }
    }
    return { result: result, newCommentId }
  }

  async lockPost(postLink: string, lockState: boolean) {
    const result = await this.evaluate<boolean>(scripts.lockPost(postLink, lockState))
    if (!result) this.logger.error(`Unable to ${lockState ? 'lock' : 'unlock'} the post (${postLink})`)
    return result
  }

  async newComment(postLink: string, content: string) {
    const result = await this.evaluate<boolean>(scripts.newComment(postLink, content))
    if (!result) this.logger.error(`Unable to create a new post comment (${postLink})`)
    return result
  }

  async getResentPosts(clubLink: string) {
    return await this.evaluate<string[] | null>(scripts.getRecentPosts(clubLink))
  }

  async getPostData(postLink: string) {
    return await this.evaluate<string | 'deleted' | null>(scripts.getPostData(postLink))
  }
}

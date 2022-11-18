import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { BoardDrawerService } from '../board-drawer/board-drawer.service'
import { ChesscomService } from '../chesscom/chesscom.service'
import { RealtimeDatabaseService } from '../database/realtime/realtime-database.service'
import { ImageHostingService } from '../image-hosting/image-hosting.service'
import { PostEditsService } from './post-edits/post-edits.service'
import { PostsService } from './posts/posts.service'
import { ForumTasksService } from './tasks/forum-tasks.service'

@Injectable()
export class ForumBotService implements OnModuleInit {
  private logger = new Logger(ForumBotService.name)

  constructor(
    private readonly boardDrawerService: BoardDrawerService,
    private readonly imageHostingService: ImageHostingService,
    private readonly httpService: HttpService,
    private readonly postEditsService: PostEditsService,
    private readonly postsService: PostsService,
    private readonly realtimeDatabaseService: RealtimeDatabaseService,
    private readonly chesscomService: ChesscomService,
    private readonly forumTasksService: ForumTasksService,
  ) {
    // this.checkPosts()
  }

  async onModuleInit() {
    this.forumTasksService.checkNewPosts.subscribe()
    this.forumTasksService.checkPosts.subscribe()
    this.forumTasksService.checkSpecificPostsObservable.subscribe()
  }
}

// mergeMap(() => this.httpService.get(CLUB_LINK).pipe(
//   concatMap(response => {
//     if (response.status !== HttpStatus.OK) {
//       this.logger.error(`Error ${response.status}: ${response.statusText}`)
//       return from(null)
//     }
//     try {
//       const links = parseHTML(response.data).querySelectorAll('.clubs-activities-link').map(x => x.attrs['href'])
//       console.log(links)
//       return from([links, 'hello!'])
//     } catch (e) {
//       this.logger.error(`Failed to parse response data`)
//       return from(null)
//     }
//   })
// )),

// $$('.post-view-meta-avatar[title="qilp"]')[5].parentElement.querySelector('#response-status').innerText.trim()
// $$('.post-view-meta-avatar[title="qilp"]')[5].parentElement.querySelector('#response-message').innerText.trim()

//TESTING:

// private checkPosts() {
//   timer(0, 1000)
//     .pipe(
//       exhaustMap(async (value) => {
//         console.log('value got', value)
//         await sleep(value < 5 ? 3000 : 100)
//         return value
//       }),
//       timeInterval(),
//     )
//     .subscribe({
//       next: async (value) => {
//         console.log('value received', value)
//       },
//       error: (e) => console.log(e),
//     })
// }

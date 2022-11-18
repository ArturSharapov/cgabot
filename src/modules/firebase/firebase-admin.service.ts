import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import { Auth } from 'firebase-admin/lib/auth/auth'
import { Database } from 'firebase-admin/lib/database/database'

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name)

  constructor(configService: ConfigService) {
    try {
      const appOptions: admin.AppOptions = {
        credential: admin.credential.cert({
          projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
        databaseURL: configService.get<string>('FIREBASE_DATABASE_URL'),
      }
      admin.initializeApp(appOptions)
      this.database = admin.database()
      this.auth = admin.auth()
    } catch (e) {
      this.logger.error(`Invalid firebase credentials`)
      throw e
    }
  }

  database: Database
  auth: Auth
}

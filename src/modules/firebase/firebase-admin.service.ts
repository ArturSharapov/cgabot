import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import { ServiceAccount } from 'firebase-admin'
import { Auth } from 'firebase-admin/lib/auth/auth'
import { Database } from 'firebase-admin/lib/database/database'

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name)

  constructor(configService: ConfigService) {
    try {
      const serviceAccount = configService.get<ServiceAccount>('Firebase.serviceAccount') ?? {}
      const appOptions: admin.AppOptions = {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: configService.get<string>('Firebase.databaseURL'),
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

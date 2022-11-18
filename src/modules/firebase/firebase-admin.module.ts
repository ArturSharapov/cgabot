import { Module } from '@nestjs/common'
import { ConfigModule, registerAs } from '@nestjs/config'
import { FirebaseAdminService } from './firebase-admin.service'

const imageHostingEnvs = registerAs('Firebase', () => ({
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  databaseURL: process.env.FIREBASE_DATABASE_URL,
}))

@Module({
  imports: [ConfigModule.forFeature(imageHostingEnvs)],
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class FirebaseAdminModule {}

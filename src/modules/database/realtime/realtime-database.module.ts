import { Module } from '@nestjs/common'
import { FirebaseAdminModule } from 'src/modules/firebase/firebase-admin.module'
import { RealtimeDatabaseService } from './realtime-database.service'

@Module({
  imports: [FirebaseAdminModule],
  providers: [RealtimeDatabaseService],
  exports: [RealtimeDatabaseService],
})
export class RealtimeDatabaseModule {}

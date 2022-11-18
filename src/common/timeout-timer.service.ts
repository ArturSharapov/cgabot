export class TimeoutTimer {
  constructor(private duration: number, private task: () => void) {}

  private timer: NodeJS.Timeout

  restart() {
    clearTimeout(this.timer)
    this.timer = setTimeout(this.task, this.duration)
  }
}

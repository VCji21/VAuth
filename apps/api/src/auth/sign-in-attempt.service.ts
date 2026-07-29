import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';

type SignInAttempt = {
  failures: number;
  firstFailureAt: number;
  blockedUntil?: number;
};

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

@Injectable()
export class SignInAttemptService {
  private readonly attempts = new Map<string, SignInAttempt>();

  assertAllowed(dto: SignInDto): void {
    const attempt = this.attempts.get(this.keyFor(dto));
    if (!attempt?.blockedUntil) {
      return;
    }

    if (attempt.blockedUntil > Date.now()) {
      throw new HttpException(
        'Too many signin attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.attempts.delete(this.keyFor(dto));
  }

  recordFailure(dto: SignInDto): void {
    const key = this.keyFor(dto);
    const now = Date.now();
    const existing = this.attempts.get(key);
    const attempt =
      existing && now - existing.firstFailureAt <= WINDOW_MS
        ? existing
        : { failures: 0, firstFailureAt: now };

    attempt.failures += 1;
    if (attempt.failures >= MAX_FAILURES) {
      attempt.blockedUntil = now + BLOCK_MS;
    }

    this.attempts.set(key, attempt);
  }

  clear(dto: SignInDto): void {
    this.attempts.delete(this.keyFor(dto));
  }

  private keyFor(dto: SignInDto): string {
    return `${dto.clientId}:${dto.email.trim().toLowerCase()}`;
  }
}

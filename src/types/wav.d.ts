declare module 'wav' {
  export class Writer {
    constructor(options: {
      channels: number;
      sampleRate: number;
      bitDepth: number;
    });
    write(data: Buffer): void;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }
}

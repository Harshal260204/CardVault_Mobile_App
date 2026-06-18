import { Test, TestingModule } from '@nestjs/testing';
import { OcrController, imageFileFilter } from './ocr.controller';
import { OcrService } from './ocr.service';
import { BadRequestException } from '@nestjs/common';

describe('OcrController imageFileFilter', () => {
  it('should accept jpeg files', () => {
    const mockFile = { mimetype: 'image/jpeg' } as any;
    const cb = jest.fn();
    imageFileFilter({} as any, mockFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should accept png files', () => {
    const mockFile = { mimetype: 'image/png' } as any;
    const cb = jest.fn();
    imageFileFilter({} as any, mockFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should accept webp files', () => {
    const mockFile = { mimetype: 'image/webp' } as any;
    const cb = jest.fn();
    imageFileFilter({} as any, mockFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should reject non-image files (e.g. pdf)', () => {
    const mockFile = { mimetype: 'application/pdf' } as any;
    const cb = jest.fn();
    imageFileFilter({} as any, mockFile, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
  });

  it('should reject text files', () => {
    const mockFile = { mimetype: 'text/plain' } as any;
    const cb = jest.fn();
    imageFileFilter({} as any, mockFile, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
  });
});


import fs from "fs";
import path from "path";

import {
  ISO_PRIMARY_VOLUME_DESCRIPTOR_OFFSET,
  ISO_PRIMARY_VOLUME_DESCRIPTOR_LENGTH,
  BIN_HEADER_LENGTH,
  BIN_BLOCK_LENGTH,
  BIN_BLOCK_HEADER_LENGTH
} from "./const";

export const getGameInfo = filePath => {
  const fd = fs.openSync(filePath, "r");

  const buffer = new Buffer.alloc(ISO_PRIMARY_VOLUME_DESCRIPTOR_LENGTH);

  fs.readSync(
    fd,
    buffer,
    0,
    ISO_PRIMARY_VOLUME_DESCRIPTOR_LENGTH,
    BIN_HEADER_LENGTH +
      BIN_BLOCK_HEADER_LENGTH +
      ISO_PRIMARY_VOLUME_DESCRIPTOR_OFFSET
  );

  const SysIndentifier = buffer
    .slice(8, 40)
    .toString()
    .trim();
  const VolIndentifier = buffer
    .slice(40, 72)
    .toString()
    .trim();
  const PublicationYear = buffer
    .slice(812, 817)
    .toString()
    .trim();

  const M_PATH_TABLE_BLOCK_NUMBER = buffer.readUInt32BE(148, 152);
  const pathTableRecordLocation = BIN_BLOCK_LENGTH * M_PATH_TABLE_BLOCK_NUMBER;
  const pathTableRecord = new Buffer.alloc(BIN_BLOCK_LENGTH);

  fs.readSync(
    fd,
    pathTableRecord,
    0,
    BIN_BLOCK_LENGTH,
    pathTableRecordLocation + BIN_BLOCK_HEADER_LENGTH
  );

  const extendLocation = pathTableRecord.readUInt32BE(2, 6);

  const filesBlock = new Buffer.alloc(BIN_BLOCK_LENGTH);
  fs.readSync(
    fd,
    filesBlock,
    0,
    BIN_BLOCK_LENGTH,
    extendLocation * BIN_BLOCK_LENGTH + BIN_BLOCK_HEADER_LENGTH
  );

  const gameId = findIdInFileBlock(filesBlock);

  return {
    SysIndentifier,
    VolIndentifier,
    PublicationYear,
    gameId
  };
};

const findIdInFileBlock = fileBlock => {
  let offset = 96;
  const FILENAME_LENGTH_INFO_POSITION = 32;
  const FILENAME_POSITION = 33;
  const GAME_ID_REGEXP = /.+\.\d{2};1/;

  for (
    let blockLength = fileBlock.slice(offset, offset + 1)[0];
    blockLength !== 0;
    offset += blockLength, blockLength = fileBlock.slice(offset, offset + 1)[0]
  ) {
    const filename = fileBlock
      .slice(
        offset + FILENAME_POSITION,
        offset +
          FILENAME_POSITION +
          fileBlock[offset + FILENAME_LENGTH_INFO_POSITION]
      )
      .toString();

    if (GAME_ID_REGEXP.test(filename)) {
      return filename.slice(0, -2).replace(/_|\./g, "");
    }
  }

  return null;
};

function withLeadingZero(n) {
  return n < 10 ? `0${n}` : n.toString();
}

function indexToTime(index) {
  const m = index / (75 * 60);
  const s = (index / 75) % 60;
  const f = index % 75;

  return `${Math.trunc(m / 10)}${Math.trunc(m % 10)}:${Math.trunc(
    s / 10
  )}${Math.trunc(s % 10)}:${Math.trunc(f / 10)}${Math.trunc(f % 10)}`;
}

export function isMultiTrack(binFilename) {
  let binIndex = 0;
  let buf = new Buffer.alloc(BIN_BLOCK_LENGTH + 100);
  let count = 0;
  let gapon = 0;

  const gapThreshold = 20; // look for 0.266 sec gap
  const valueThreshold = 800; // look for samples < 700

  let binFd = fs.openSync(binFilename, "r");

  let blank;
  let value;

  let ret = false;

  while (
    fs.readSync(binFd, buf, 0, BIN_BLOCK_LENGTH, BIN_BLOCK_LENGTH * binIndex)
  ) {
    blank = 1;

    for (let i = 0; i < BIN_BLOCK_LENGTH; i += 2) {
      value = (((buf[i + 1] << 8) | buf[i]) << 16) >> 16;

      if (Math.abs(value) > valueThreshold) {
        blank = 0;
        break;
      }
    }

    if (blank === 1) count++;

    if (count > gapThreshold && gapon === 0) {
      ret = true;
      break;
    }

    binIndex++;
  }

  fs.closeSync(binFd);
  return ret;
}

// JS port of the C version from bin2iso by Bob Doiron
export function doCueFile(cuePath, binPath, { inMemory = false }) {
  let binIndex = 0;
  let buf = new Buffer.alloc(BIN_BLOCK_LENGTH + 100);
  let count = 0;
  let track = 1;
  let gapon = 0;
  let index0 = "00:00:00";
  let index1 = "00:00:00";
  let trackIndex = 0;

  const gapThreshold = 20; // look for 0.266 sec gap
  const valueThreshold = 800; // look for samples < 700

  const splitBinPath = binPath.split(path.sep);
  const binFilename = splitBinPath[splitBinPath.length - 1];

  let cueContent = `FILE ${binFilename} BINARY\n`;
  let cueFd = fs.openSync(cuePath, "w");
  let binFd = fs.openSync(binPath, "r");

  let blank;
  let value;
  let mode;

  while (
    fs.readSync(binFd, buf, 0, BIN_BLOCK_LENGTH, BIN_BLOCK_LENGTH * binIndex)
  ) {
    if (trackIndex === 0) {
      if (
        buf[0] === 0x00 &&
        buf[1] === 0xff &&
        buf[2] === 0xff &&
        buf[3] === 0xff &&
        buf[4] === 0xff &&
        buf[5] === 0xff &&
        buf[6] === 0xff &&
        buf[7] === 0xff &&
        buf[8] === 0xff &&
        buf[9] === 0xff &&
        buf[10] === 0xff &&
        buf[11] === 0x00
      ) {
        mode = `MODE${buf[15]}/2352`;
      } else {
        mode = "AUDIO";
      }
    }

    if (binIndex === 0) {
      cueContent += `  TRACK ${withLeadingZero(track)} ${mode}
    INDEX 01 ${index0}
`;
    }

    blank = 1;
    for (let i = 0; i < BIN_BLOCK_LENGTH; i += 2) {
      value = buf[i + 1];
      value = (((value << 8) | buf[i]) << 16) >> 16;

      if (Math.abs(value) > valueThreshold) {
        blank = 0;
        break;
      }
    }

    if (blank === 1) count++;
    else if (gapon === 1) {
      gapon = 0;

      index0 = indexToTime(binIndex - count);
      count = 0;
      index1 = indexToTime(binIndex);

      cueContent += `  TRACK ${withLeadingZero(track)} ${mode}
    INDEX 00 ${index0}
    INDEX 01 ${index1}
`;
    }

    if (count > gapThreshold && gapon === 0) {
      gapon = 1;
      track++;
    } else {
      trackIndex++;
    }

    binIndex++;
  }

  !inMemory && fs.writeFileSync(cueFd, cueContent);

  fs.closeSync(binFd);
  fs.closeSync(cueFd);

  return cueContent;
}

export async function validateCueFile(cuePath, binPath) {
  let cueFileContent = null;

  try {
    cueFileContent = (await fs.promises.readFile(cuePath))
      .toString()
      .replace(/\s|\n/g, "");
  } catch (_) {
    return false;
  }

  const generatedCueFile = doCueFile(cuePath, binPath, {
    inMemory: true
  }).replace(/\s|\n/g, "");

  return cueFileContent === generatedCueFile;
}

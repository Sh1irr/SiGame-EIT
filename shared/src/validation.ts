import type { Category, MediaBlock, Pack, Question, Round } from './types.js';

export interface ValidationError {
  message: string;
  roundIndex?: number;
  categoryIndex?: number;
  slotIndex?: number;
}

export interface ValidatePackOptions {
  mediaFileExists?: (file: string) => boolean;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function checkMediaBlocks(
  blocks: MediaBlock[],
  mediaFileExists: (file: string) => boolean,
  makeError: (message: string) => ValidationError,
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const block of blocks) {
    if (block.type !== 'text' && !mediaFileExists(block.file)) {
      errors.push(makeError(`Медіафайл не знайдено: ${block.file}`));
    }
  }
  return errors;
}

function validateQuestion(
  question: Question,
  roundIndex: number,
  categoryIndex: number,
  slotIndex: number,
  mediaFileExists: (file: string) => boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const makeError = (message: string): ValidationError => ({
    message,
    roundIndex,
    categoryIndex,
    slotIndex,
  });

  if (question.content.length < 1) {
    errors.push(makeError('Питання має містити хоча б один блок контенту'));
  }
  if (question.answer.length < 1) {
    errors.push(makeError('Питання має містити хоча б один блок відповіді'));
  }

  const optionsCount = question.options.length;
  if (optionsCount !== 0 && (optionsCount < 2 || optionsCount > 4)) {
    errors.push(makeError('Кількість варіантів відповіді має бути 0 або від 2 до 4'));
  } else if (optionsCount >= 2) {
    const hasCorrectOption = question.options.some((option) => option.id === question.correctOptionId);
    if (!hasCorrectOption) {
      errors.push(makeError('Не позначено правильний варіант відповіді'));
    }
  }

  errors.push(...checkMediaBlocks(question.content, mediaFileExists, makeError));
  errors.push(...checkMediaBlocks(question.answer, mediaFileExists, makeError));

  return errors;
}

function validateCategory(
  category: Category,
  roundIndex: number,
  categoryIndex: number,
  mediaFileExists: (file: string) => boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const makeError = (message: string): ValidationError => ({ message, roundIndex, categoryIndex });

  if (category.name.trim().length === 0) {
    errors.push(makeError('Назва категорії не може бути порожньою'));
  }
  if (category.slots.length !== 5) {
    errors.push(makeError('У категорії має бути рівно 5 слотів'));
  }

  const questions = category.slots.filter((slot): slot is Question => slot !== null);
  if (questions.length < 1) {
    errors.push(makeError('У категорії має бути хоча б одне питання'));
  }

  category.slots.forEach((slot, slotIndex) => {
    if (slot !== null) {
      errors.push(...validateQuestion(slot, roundIndex, categoryIndex, slotIndex, mediaFileExists));
    }
  });

  return errors;
}

function validateRound(round: Round, roundIndex: number, mediaFileExists: (file: string) => boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  const makeError = (message: string): ValidationError => ({ message, roundIndex });

  if (round.categories.length < 1 || round.categories.length > 5) {
    errors.push(makeError('У раунді має бути від 1 до 5 категорій'));
  }
  if (round.prices.length !== 5 || !round.prices.every(isPositiveInteger)) {
    errors.push(makeError('Усі ціни раунду мають бути додатними цілими числами'));
  }

  round.categories.forEach((category, categoryIndex) => {
    errors.push(...validateCategory(category, roundIndex, categoryIndex, mediaFileExists));
  });

  return errors;
}

export function validatePack(pack: Pack, options: ValidatePackOptions = {}): ValidationError[] {
  const mediaFileExists = options.mediaFileExists ?? (() => true);
  const errors: ValidationError[] = [];

  if (pack.title.trim().length === 0) {
    errors.push({ message: 'Пак має мати назву' });
  }
  if (pack.rounds.length < 1) {
    errors.push({ message: 'Пак має містити хоча б один раунд' });
  }
  if (pack.logo && !mediaFileExists(pack.logo)) {
    errors.push({ message: `Медіафайл логотипу не знайдено: ${pack.logo}` });
  }

  pack.rounds.forEach((round, roundIndex) => {
    errors.push(...validateRound(round, roundIndex, mediaFileExists));
  });

  return errors;
}

export function canMarkPackReady(pack: Pack, options: ValidatePackOptions = {}): boolean {
  return validatePack(pack, options).length === 0;
}

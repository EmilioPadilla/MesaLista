import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from 'utils/utils';

export interface PasswordStrength {
  score: number; // 0-4
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  return {
    score: calculateScore(password),
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function calculateScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return Math.min(score, 4);
}

function getStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Muy débil';
    case 2:
      return 'Débil';
    case 3:
      return 'Buena';
    case 4:
      return 'Muy segura';
    default:
      return '';
  }
}

function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

export function PasswordStrengthIndicator({ password, showRequirements = true, className }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  const strengthLabel = getStrengthLabel(strength.score);
  const strengthColor = getStrengthColor(strength.score);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Seguridad de la contraseña:</span>
          <span className={cn('font-medium', strength.score >= 3 ? 'text-green-600' : strength.score >= 2 ? 'text-orange-600' : 'text-red-600')}>
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1 h-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className={cn('flex-1 rounded-full transition-colors', index < strength.score ? strengthColor : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Requisitos:</p>
          <div className="space-y-1.5">
            <RequirementItem met={strength.hasMinLength} text="Mínimo 8 caracteres" />
            <RequirementItem met={strength.hasUppercase} text="Al menos una letra mayúscula" />
            <RequirementItem met={strength.hasLowercase} text="Al menos una letra minúscula" />
            <RequirementItem met={strength.hasNumber} text="Al menos un número" />
            <RequirementItem met={strength.hasSpecialChar} text="Carácter especial (opcional, pero recomendado)" optional />
          </div>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
  optional?: boolean;
}

function RequirementItem({ met, text, optional }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <X className={cn('h-3.5 w-3.5 flex-shrink-0', optional ? 'text-gray-400' : 'text-red-500')} />
      )}
      <span className={cn(met ? 'text-green-700' : optional ? 'text-muted-foreground' : 'text-foreground')}>{text}</span>
    </div>
  );
}

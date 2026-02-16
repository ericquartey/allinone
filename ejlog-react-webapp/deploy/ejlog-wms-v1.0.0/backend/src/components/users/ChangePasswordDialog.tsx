/**
 * ChangePasswordDialog Component
 * Dialog for changing user password with strength indicator
 */

import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/types/user.types';
import { useChangePassword } from '@/hooks/useUsers';
import { calculatePasswordStrength } from '@/services/api/userManagementApi';
import { Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

// ============================================================================
// Form Schema
// ============================================================================

const createPasswordSchema = (requireOldPassword: boolean) => {
  const baseSchema = {
    newPassword: z
      .string()
      .min(6, 'Password minimo 6 caratteri')
      .max(100, 'Password troppo lunga'),
    confirmPassword: z.string(),
  };

  if (requireOldPassword) {
    return z
      .object({
        oldPassword: z.string().min(1, 'Password corrente obbligatoria'),
        ...baseSchema,
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Le password non coincidono',
        path: ['confirmPassword'],
      });
  }

  return z
    .object(baseSchema)
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Le password non coincidono',
      path: ['confirmPassword'],
    });
};

type PasswordFormValues =
  | {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  | {
      newPassword: string;
      confirmPassword: string;
    };

// ============================================================================
// Password Strength Indicator
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrengthIndicator: FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);

  const config = {
    weak: { label: 'Debole', color: 'bg-red-600', width: 'w-1/3' },
    medium: { label: 'Media', color: 'bg-yellow-600', width: 'w-2/3' },
    strong: { label: 'Forte', color: 'bg-green-600', width: 'w-full' },
  };

  const current = config[strength];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Sicurezza password:</span>
        <span className="font-medium">{current.label}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${current.color} ${current.width} transition-all duration-300`}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface ChangePasswordDialogProps {
  user: User | null;
  currentUserId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog: FC<ChangePasswordDialogProps> = ({
  user,
  currentUserId,
  open,
  onOpenChange,
}) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useChangePassword();

  if (!user) return null;

  const isChangingOwnPassword = user.id === currentUserId;
  const requireOldPassword = isChangingOwnPassword;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(createPasswordSchema(requireOldPassword)),
    defaultValues: requireOldPassword
      ? { oldPassword: '', newPassword: '', confirmPassword: '' }
      : { newPassword: '', confirmPassword: '' },
  });

  const newPassword = form.watch('newPassword');

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        id: user.id,
        data: {
          oldPassword: 'oldPassword' in values ? values.oldPassword : undefined,
          newPassword: values.newPassword,
        },
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation onError
      console.error('Change password error:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Cambia Password
          </DialogTitle>
          <DialogDescription>
            {isChangingOwnPassword
              ? 'Modifica la tua password inserendo quella corrente e la nuova.'
              : `Imposta una nuova password per l'utente ${user.utente}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                La password deve contenere almeno 6 caratteri. Si consiglia l'uso di lettere
                maiuscole, minuscole, numeri e caratteri speciali.
              </AlertDescription>
            </Alert>

            {/* Old Password (only if changing own password) */}
            {requireOldPassword && 'oldPassword' in form.getValues() && (
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Corrente *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Inserisci password corrente"
                          autoComplete="current-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          {showOldPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* New Password */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuova Password *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Inserisci nuova password"
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={newPassword || ''} />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conferma Password *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Ripeti nuova password"
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={changePasswordMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Cambia Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

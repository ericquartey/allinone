/**
 * UserDialog Component
 * Create and Edit user dialog with form validation
 */

import { FC, useEffect, useState } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { User, UserDialogMode, CreateUserDTO, UpdateUserDTO } from '@/types/user.types';
import { useCreateUser, useUpdateUser, useUserGroups } from '@/hooks/useUsers';
import { UserPlus, UserCog, Eye, EyeOff, Barcode } from 'lucide-react';
import { calculatePasswordStrength } from '@/services/api/userManagementApi';

// ============================================================================
// Form Schemas
// ============================================================================

// Create User Schema
const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username minimo 3 caratteri')
      .max(50, 'Username massimo 50 caratteri')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Solo lettere, numeri, _ e -'),
    password: z.string().min(6, 'Password minimo 6 caratteri').max(100),
    confirmPassword: z.string(),
    groupId: z.number({ required_error: 'Seleziona un gruppo' }).min(1, 'Gruppo obbligatorio'),
    languageId: z.number().optional(),
    barcode: z.string().max(100).optional(),
    lockPpcLogin: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

// Edit User Schema (no username, no password)
const editUserSchema = z.object({
  groupId: z.number({ required_error: 'Seleziona un gruppo' }).min(1, 'Gruppo obbligatorio'),
  languageId: z.number().optional(),
  barcode: z.string().max(100).optional(),
  lockPpcLogin: z.boolean().default(false),
});

type CreateFormValues = z.infer<typeof createUserSchema>;
type EditFormValues = z.infer<typeof editUserSchema>;

// ============================================================================
// Hardcoded Languages (future: fetch from API)
// ============================================================================

const LANGUAGES = [
  { id: 1, code: 'IT', name: 'Italiano' },
  { id: 2, code: 'EN', name: 'English' },
  { id: 3, code: 'FR', name: 'Français' },
];

// ============================================================================
// Main Component
// ============================================================================

interface UserDialogProps {
  mode: UserDialogMode;
  user: User | null; // null for create, User for edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDialog: FC<UserDialogProps> = ({ mode, user, open, onOpenChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: userGroups, isLoading: loadingGroups } = useUserGroups();

  const isCreateMode = mode === 'create';

  // Create mode form
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      groupId: undefined,
      languageId: 1, // Default: Italian
      barcode: '',
      lockPpcLogin: false,
    },
  });

  // Edit mode form
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      groupId: user?.gruppoUtente.id || undefined,
      languageId: user?.lingua.id || 1,
      barcode: user?.barcode || '',
      lockPpcLogin: user?.lockPpcLogin || false,
    },
  });

  const form = isCreateMode ? createForm : editForm;

  // Update edit form when user changes
  useEffect(() => {
    if (mode === 'edit' && user) {
      editForm.reset({
        groupId: user.gruppoUtente.id,
        languageId: user.lingua.id,
        barcode: user.barcode || '',
        lockPpcLogin: user.lockPpcLogin,
      });
    }
  }, [mode, user, editForm]);

  const onSubmit = async (values: CreateFormValues | EditFormValues) => {
    try {
      if (isCreateMode && 'username' in values) {
        // Create user
        const createData: CreateUserDTO = {
          username: values.username,
          password: values.password,
          groupId: values.groupId,
          languageId: values.languageId,
          barcode: values.barcode || undefined,
          lockPpcLogin: values.lockPpcLogin,
        };

        await createUserMutation.mutateAsync(createData);
      } else if (!isCreateMode && user) {
        // Update user
        const updateData: UpdateUserDTO = {
          groupId: values.groupId,
          languageId: values.languageId,
          barcode: values.barcode || undefined,
          lockPpcLogin: values.lockPpcLogin,
        };

        await updateUserMutation.mutateAsync({
          id: user.id,
          data: updateData,
        });
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation onError
      console.error('User dialog error:', error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const password = isCreateMode ? createForm.watch('password') : '';

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreateMode ? (
              <>
                <UserPlus className="h-5 w-5 text-blue-600" />
                Nuovo Utente
              </>
            ) : (
              <>
                <UserCog className="h-5 w-5 text-blue-600" />
                Modifica Utente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Crea un nuovo utente inserendo tutti i dati richiesti.'
              : `Modifica i dati dell'utente ${user?.utente}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username (CREATE only) */}
              {isCreateMode && 'username' in form.getValues() && (
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="es. mario.rossi"
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimo 3 caratteri. Solo lettere, numeri, _ e -
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Password (CREATE only) */}
              {isCreateMode && 'password' in form.getValues() && (
                <>
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Password"
                              autoComplete="new-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
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

                  <FormField
                    control={createForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conferma Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Ripeti password"
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

                  {/* Password Strength */}
                  {password && (
                    <div className="md:col-span-2">
                      <PasswordStrength password={password} />
                    </div>
                  )}
                </>
              )}

              {/* Group Select */}
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gruppo *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={loadingGroups}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona gruppo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.nome} (Livello {group.livelloPrivilegi})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Language Select */}
              <FormField
                control={form.control}
                name="languageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lingua</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona lingua" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id.toString()}>
                            {lang.name} ({lang.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Barcode */}
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Scansiona o inserisci barcode"
                          {...field}
                          value={field.value || ''}
                        />
                        <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Barcode associato all'utente (opzionale)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lock PPC Login */}
              <FormField
                control={form.control}
                name="lockPpcLogin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Blocca login da PPC</FormLabel>
                      <FormDescription>
                        Se attivo, l'utente non potrà effettuare login da terminali PPC
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Annulla
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                {isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    {isCreateMode ? (
                      <UserPlus className="h-4 w-4 mr-2" />
                    ) : (
                      <UserCog className="h-4 w-4 mr-2" />
                    )}
                    {isCreateMode ? 'Crea Utente' : 'Salva Modifiche'}
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

// ============================================================================
// Password Strength Component
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: FC<PasswordStrengthProps> = ({ password }) => {
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

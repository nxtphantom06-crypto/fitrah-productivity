import { createFileRoute } from '@tanstack/react-router';
import { PasswordResetPage } from '@/components/fitrah/password-reset';
import { pageHead } from '@/components/fitrah/foundation';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('Reset password','Securely reset your Fitrah account password.'),component:PasswordResetPage});

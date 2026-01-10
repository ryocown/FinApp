import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const user = authService.user();

    if (user) {
        // Convert Promise to Observable
        return from(user.getIdToken()).pipe(
            take(1),
            switchMap((token: any) => {
                const clonedRequest = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(clonedRequest);
            })
        );
    }

    return next(req);
};

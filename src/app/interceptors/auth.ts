import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    const token = localStorage.getItem('token');

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `${token}` 
        }
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {

  constructor(private http: HttpClient) {  } 

  url = 'http://localhost:3000/letters';

  getAllArchivedLetters() {
    return this.http.get(this.url + '/get-all-archived-letters');
  }

  getArchivedLettersByType(type: string) {
    return this.http.get(this.url + '/get-archived/' + type);
  }

   addArchive(formData: FormData): Observable<any> {
    return this.http.post(`${this.url}/add-archive`, formData, {
    });
  }

  getPersonalArchive() {
    return this.http.get(this.url + '/get-user-archived-letters');
  }

  getArchivedsupervisor() {
    return this.http.get(this.url + '/get-reviewer-archives');
  }
}
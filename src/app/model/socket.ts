import { BehaviorSubject } from "rxjs";
import { Notification } from "../model/notification";
import { Observable } from "rxjs";
import { HttpHeaders } from "@angular/common/http";

export interface Socket {
    socket: any;
    notificationsSubject: BehaviorSubject<Notification[]>;
    notifications$: Observable<Notification[]>;
    API_URL: string;
    getAuthHeaders(): HttpHeaders;
}

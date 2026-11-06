
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // CUSTOMER

  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data, {
      headers: this.getHeaders()
    });
  }

  getMyOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/my-orders`, {
      headers: this.getHeaders()
    });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, {
      headers: this.getHeaders()
    });
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`, {
      headers: this.getHeaders()
    });
  }

  // COURIER

  getCourierOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/courier/orders`, {
      headers: this.getHeaders()
    });
  }

  decideAssignment(id: number, status: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/courier/assignments/${id}`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  updateDeliveryStatus(id: number, status: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/courier/orders/${id}/status`,
      {
        status,
        note: `Courier updated status to ${status}`
      },
      { headers: this.getHeaders() }
    );
  }

  // ADMIN

  getAdminOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/orders`, {
      headers: this.getHeaders()
    });
  }

  getAdminAssignments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/assignments`, {
      headers: this.getHeaders()
    });
  }

  updateAdminOrder(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteAdminOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/orders/${id}`, {
      headers: this.getHeaders()
    });
  }

  assignOrder(order_id: number, courier_id: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/assign-order`,
      { order_id, courier_id },
      { headers: this.getHeaders() }
    );
  }

  reassignOrder(order_id: number, courier_id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/reassign-order`,
      { order_id, courier_id },
      { headers: this.getHeaders() }
    );
  }
}

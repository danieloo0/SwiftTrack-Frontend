
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { timeout, finalize } from 'rxjs';
import { AuthService } from './services/auth.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  email = '';
  password = '';
  error = '';
  loading = false;
  loggedIn = false;

  userName = '';
  userRole = '';

  // CUSTOMER
  showCreateOrder = false;
  showMyOrders = false;

  pickupAddress = '';
  deliveryAddress = '';
  packageDetails = '';
  deliveryTime = '';

  orderMessage = '';
  orderError = '';
  creatingOrder = false;

  orders: any[] = [];
  loadingOrders = false;
  ordersError = '';

  selectedOrder: any = null;
  loadingDetails = false;
  detailsError = '';
  cancellingOrder = false;

  // COURIER
  courierOrders: any[] = [];
  loadingCourierOrders = false;
  courierError = '';
  courierMessage = '';
  processingAssignment = false;

  // ADMIN
  adminOrders: any[] = [];
  adminAssignments: any[] = [];
  loadingAdmin = false;
  adminError = '';
  adminMessage = '';

  assignOrderId: number | null = null;
  courierId: number | null = null;

  editingOrder = false;
  editOrderId = 0;
  editPickupAddress = '';
  editDeliveryAddress = '';
  editPackageDetails = '';
  editDeliveryTime = '';

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  // LOGIN

  login() {
    this.error = '';
    this.loading = true;

    this.authService.login(this.email, this.password).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access_token);

        this.userName = response.user?.name || 'User';
        this.userRole = response.user?.role || 'customer';
        this.loggedIn = true;

        if (this.userRole === 'courier') {
          this.loadCourierOrders();
        }

        if (this.userRole === 'admin') {
          this.loadAdminData();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = error.error?.detail || 'Login failed.';
        this.cdr.detectChanges();
      }
    });
  }

  // CUSTOMER ORDERS

  loadMyOrders() {
    this.showMyOrders = true;
    this.selectedOrder = null;
    this.ordersError = '';
    this.loadingOrders = true;

    this.orderService.getMyOrders().pipe(
      finalize(() => {
        this.loadingOrders = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.orders = response.orders || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.ordersError = error.error?.detail || 'Could not load orders.';
        this.cdr.detectChanges();
      }
    });
  }

  viewOrderDetails(id: number) {
    this.loadingDetails = true;
    this.detailsError = '';
    this.selectedOrder = null;

    this.orderService.getOrder(id).pipe(
      finalize(() => {
        this.loadingDetails = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.selectedOrder = response.order || response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.detailsError = error.error?.detail || 'Could not load order details.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelOrder(id: number) {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    this.cancellingOrder = true;

    this.orderService.cancelOrder(id).pipe(
      finalize(() => {
        this.cancellingOrder = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.selectedOrder = null;
        this.loadMyOrders();
      },
      error: (error) => {
        this.ordersError = error.error?.detail || 'Could not cancel order.';
        this.cdr.detectChanges();
      }
    });
  }

  // CREATE ORDER

  createOrder() {
    this.orderMessage = '';
    this.orderError = '';

    if (
      !this.pickupAddress.trim() ||
      !this.deliveryAddress.trim() ||
      !this.packageDetails.trim() ||
      !this.deliveryTime
    ) {
      this.orderError = 'Please fill in all fields.';
      return;
    }

    const selectedDate = new Date(this.deliveryTime);

    if (isNaN(selectedDate.getTime())) {
      this.orderError = 'Please enter a valid delivery date and time.';
      return;
    }

    this.creatingOrder = true;
    this.cdr.detectChanges();

    const data = {
      pickup_address: this.pickupAddress.trim(),
      delivery_address: this.deliveryAddress.trim(),
      package_details: this.packageDetails.trim(),
      delivery_time: selectedDate.toISOString()
    };

    this.orderService.createOrder(data).pipe(
      timeout(15000),
      finalize(() => {
        this.creatingOrder = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.orderMessage = 'Order created successfully!';

        this.pickupAddress = '';
        this.deliveryAddress = '';
        this.packageDetails = '';
        this.deliveryTime = '';

        this.loadMyOrders();
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (error.name === 'TimeoutError') {
          this.orderError = 'Request timed out. Check your backend server.';
        } else {
          this.orderError =
            error.error?.detail ||
            `Could not create order. Error: ${error.status || 'Unknown'}`;
        }

        this.cdr.detectChanges();
      }
    });
  }

  // COURIER

  loadCourierOrders() {
    this.loadingCourierOrders = true;
    this.courierError = '';

    this.orderService.getCourierOrders().pipe(
      finalize(() => {
        this.loadingCourierOrders = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.courierOrders = response.orders || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.courierError = error.error?.detail || 'Could not load courier orders.';
        this.cdr.detectChanges();
      }
    });
  }

  decideAssignment(id: number, status: string) {
    this.processingAssignment = true;
    this.courierMessage = '';
    this.courierError = '';

    this.orderService.decideAssignment(id, status).pipe(
      finalize(() => {
        this.processingAssignment = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.courierMessage = response.message || 'Assignment updated successfully.';
        this.loadCourierOrders();
      },
      error: (error) => {
        this.courierError = error.error?.detail || 'Could not process assignment.';
        this.cdr.detectChanges();
      }
    });
  }

  updateDeliveryStatus(id: number, status: string) {
    this.processingAssignment = true;
    this.courierMessage = '';
    this.courierError = '';

    this.orderService.updateDeliveryStatus(id, status).pipe(
      finalize(() => {
        this.processingAssignment = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.courierMessage = response.message || 'Delivery status updated successfully.';
        this.loadCourierOrders();
      },
      error: (error) => {
        this.courierError = error.error?.detail || 'Could not update delivery status.';
        this.cdr.detectChanges();
      }
    });
  }

  // ADMIN DASHBOARD

  loadAdminData() {
    this.loadingAdmin = true;
    this.adminError = '';

    this.orderService.getAdminOrders().subscribe({
      next: (response) => {
        this.adminOrders = response.orders || [];

        this.orderService.getAdminAssignments().subscribe({
          next: (assignmentResponse) => {
            this.adminAssignments = assignmentResponse.assignments || [];
            this.loadingAdmin = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.adminError = error.error?.detail || 'Could not load assignments.';
            this.loadingAdmin = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        this.adminError = error.error?.detail || 'Could not load orders.';
        this.loadingAdmin = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectOrderForEdit(order: any) {
    this.editOrderId = order.id;
    this.editPickupAddress = order.pickup_address;
    this.editDeliveryAddress = order.delivery_address;
    this.editPackageDetails = order.package_details;

    const date = new Date(order.delivery_time);

    this.editDeliveryTime = isNaN(date.getTime())
      ? ''
      : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16);

    this.editingOrder = true;
  }

  saveAdminOrder() {
    this.adminError = '';
    this.adminMessage = '';

    if (
      !this.editPickupAddress.trim() ||
      !this.editDeliveryAddress.trim() ||
      !this.editPackageDetails.trim() ||
      !this.editDeliveryTime
    ) {
      this.adminError = 'Please fill in all order fields.';
      return;
    }

    const date = new Date(this.editDeliveryTime);

    if (isNaN(date.getTime())) {
      this.adminError = 'Please enter a valid delivery date and time.';
      return;
    }

    const data = {
      pickup_address: this.editPickupAddress.trim(),
      delivery_address: this.editDeliveryAddress.trim(),
      package_details: this.editPackageDetails.trim(),
      delivery_time: date.toISOString()
    };

    this.orderService.updateAdminOrder(this.editOrderId, data).subscribe({
      next: (response) => {
        this.adminMessage = response.message || 'Order updated successfully.';
        this.editingOrder = false;
        this.loadAdminData();
      },
      error: (error) => {
        this.adminError = error.error?.detail || 'Could not update order.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteAdminOrder(id: number) {
    if (!confirm(`Are you sure you want to delete order #${id}?`)) {
      return;
    }

    this.adminError = '';
    this.adminMessage = '';

    this.orderService.deleteAdminOrder(id).subscribe({
      next: (response) => {
        this.adminMessage = response.message || 'Order deleted successfully.';
        this.loadAdminData();
      },
      error: (error) => {
        this.adminError = error.error?.detail || 'Could not delete order.';
        this.cdr.detectChanges();
      }
    });
  }

  assignCourier() {
    this.adminError = '';
    this.adminMessage = '';

    if (!this.assignOrderId || !this.courierId) {
      this.adminError = 'Enter both order ID and courier ID.';
      return;
    }

    this.orderService.assignOrder(this.assignOrderId, this.courierId).subscribe({
      next: (response) => {
        this.adminMessage = response.message || 'Courier assigned successfully.';
        this.loadAdminData();
      },
      error: (error) => {
        this.adminError = error.error?.detail || 'Could not assign courier.';
        this.cdr.detectChanges();
      }
    });
  }

  reassignCourier() {
    this.adminError = '';
    this.adminMessage = '';

    if (!this.assignOrderId || !this.courierId) {
      this.adminError = 'Enter both order ID and courier ID.';
      return;
    }

    this.orderService.reassignOrder(this.assignOrderId, this.courierId).subscribe({
      next: (response) => {
        this.adminMessage = response.message || 'Courier reassigned successfully.';
        this.loadAdminData();
      },
      error: (error) => {
        this.adminError = error.error?.detail || 'Could not reassign courier.';
        this.cdr.detectChanges();
      }
    });
  }

  // LOGOUT

  logout() {
    localStorage.removeItem('access_token');

    this.loggedIn = false;
    this.email = '';
    this.password = '';
    this.userName = '';
    this.userRole = '';

    this.showCreateOrder = false;
    this.showMyOrders = false;

    this.orders = [];
    this.selectedOrder = null;
    this.courierOrders = [];

    this.adminOrders = [];
    this.adminAssignments = [];
    this.editingOrder = false;

    this.orderMessage = '';
    this.orderError = '';
    this.ordersError = '';
    this.courierMessage = '';
    this.courierError = '';
    this.adminMessage = '';
    this.adminError = '';

    this.cdr.detectChanges();
  }
}

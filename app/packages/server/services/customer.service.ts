import { type Customer } from '@prisma/client';
import { customerRepository } from '../repositories/customer.repository';

export const customerService = {
   async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
      return customerRepository.createCustomer(data);
   },

   async getAllCustomers(): Promise<Customer[]> {
      return customerRepository.getAllCustomers();
   },

   async getCustomerById(id: number): Promise<Customer | null> {
      return customerRepository.getCustomerById(id);
   },

   async getCustomerByNameAndPhone(
      name: string,
      phone: string
   ): Promise<Customer | null> {
      return customerRepository.getCustomerByNameAndPhone(name, phone);
   },

   async updateCustomer(
      id: number,
      data: Partial<Omit<Customer, 'id'>>
   ): Promise<void> {
      await customerRepository.updateCustomer(id, data);
   },

   async deleteCustomer(id: number): Promise<void> {
      await customerRepository.deleteCustomer(id);
   },
};

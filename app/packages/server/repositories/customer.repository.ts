import { type Customer } from '@prisma/client';
import { prisma } from '../prisma';

export const customerRepository = {
   async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
      return prisma.customer.create({
         data,
      });
   },

   async getAllCustomers(): Promise<Customer[]> {
      return prisma.customer.findMany();
   },

   async getCustomerById(id: number): Promise<Customer | null> {
      return prisma.customer.findUnique({
         where: { id },
      });
   },

   async getCustomerByNameAndPhone(
      name: string,
      phone: string
   ): Promise<Customer | null> {
      return prisma.customer.findFirst({
         where: { name, phone },
      });
   },

   async updateCustomer(
      id: number,
      data: Partial<Omit<Customer, 'id'>>
   ): Promise<void> {
      await prisma.customer.update({
         where: { id },
         data,
      });
   },

   async deleteCustomer(id: number): Promise<void> {
      await prisma.customer.delete({
         where: { id },
      });
   },
};

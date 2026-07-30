import type { Request, Response } from 'express';
import z from 'zod';
import { customerService } from '../services/customer.service';
import { isValidPhone } from '../utils/validations';

const customerCreateRequestSchema = z.object({
   name: z.string().min(1, 'Name is required'),
   phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine((val) => isValidPhone(val), {
         message: 'Please enter a valid phone number (e.g. 021 123 456)',
      }),
});

export const customerController = {
   async createCustomer(req: Request, res: Response) {
      // Logic to create a new customer
      const parseResult = customerCreateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }
      try {
         const { name, phone } = parseResult.data;
         await customerService.createCustomer({
            name,
            phone,
            createdAt: new Date(), // Adding createdAt property
         });
         res.json({ message: 'customer created successfully' });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to create customer' });
      }
   },

   async getAllCustomers(req: Request, res: Response) {
      // Logic to retrieve all customers
      try {
         const customers = await customerService.getAllCustomers();
         res.json({ customers: customers }); // Return an array of customers
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve customers' });
      }
   },

   async getCustomerById(req: Request, res: Response) {
      // Logic to retrieve a customer by ID
      const id = Number(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: 'Invalid customer ID' });
      }
      try {
         const customer = await customerService.getCustomerById(id);
         if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
         }
         res.json({ customer: customer });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve customer' });
      }
   },

   async getCustomerByNameAndPhone(req: Request, res: Response) {
      // Logic to retrieve a customer by name and phone number
      const { name, phone } = req.query;

      if (typeof name !== 'string' || typeof phone !== 'string') {
         return res
            .status(400)
            .json({ error: 'Name and phone query parameters are required' });
      }

      try {
         const customer = await customerService.getCustomerByNameAndPhone(
            name,
            phone
         );
         if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
         }
         res.json({ customer: customer });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve customer' });
      }
   },

   async deleteCustomer(req: Request, res: Response) {
      // Logic to delete a customer by ID

      try {
         const customerId = Number(req.params.id);

         if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
         }

         await customerService.deleteCustomer(customerId);

         res.json({
            message: `Customer deleted successfully`,
         });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to delete customer' });
      }
   },
};

import { userRepository } from '../repositories/user.repository';

export const userService = {
   async listUsers() {
      return userRepository.findAll();
   },

   async deleteUser(id: number, currentUserId: number) {
      if (id === currentUserId) {
         throw new Error('Cannot delete your own account');
      }

      const user = await userRepository.findById(id);
      if (!user) {
         throw new Error('User not found');
      }

      await userRepository.delete(id);
   },
};

import { FaArrowUp } from 'react-icons/fa';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';

export type ChatFormData = {
   prompt: string;
};

type Props = {
   onSubmit: (data: ChatFormData) => void;
};

const ChatInput = ({ onSubmit }: Props) => {
   const { register, handleSubmit, reset, formState } = useForm<ChatFormData>();

   const submit = handleSubmit((data) => {
      reset({ prompt: '' });
      onSubmit(data);
   });

   const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         submit();
      }
   };

   return (
      <form
         onSubmit={submit}
         onKeyDown={handleKeyDown}
         className="flex flex-col gap-2 items-end border-2 p-4 rounded-3xl"
      >
         <textarea
            // className="w-full border-0 focus:outline-0 resize-none"
            className="w-full min-h-20 max-h-48 overflow-y-auto border-0 focus:outline-0 resize-none"
            placeholder="Ask anything"
            maxLength={200}
            rows={3}
            autoFocus
            {...register('prompt', {
               required: true,
               validate: (value) => value.trim() !== '',
            })}
         />
         <Button
            disabled={!formState.isValid}
            className="self-end rounded-full w-9 h-9"
         >
            <FaArrowUp />
         </Button>
      </form>
   );
};
export default ChatInput;

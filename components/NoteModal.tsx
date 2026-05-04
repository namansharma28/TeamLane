// components/NoteModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, User, Calendar } from "lucide-react"; // Import trash icon
import { formatDistanceToNow } from 'date-fns';
import { useSession } from "next-auth/react"; // For checking current user

// Define the Note interface
interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    email: string;
    name?: string;
  };
}

// Update interface to include team role
interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  teamRole?: string; // Add this for checking admin status
  onDelete: (noteId: string) => Promise<void>;
}

export function NoteModal({ note, isOpen, onClose, teamRole, onDelete }: NoteModalProps) {
  const { data: session } = useSession();
  if (!note) return null;

  const canDelete = 
    session?.user?.email === note.createdBy.email || // Note creator
    teamRole === 'admin'; // Team admin

  const handleDelete = async () => {
    if (!note._id) return;
    try {
      await onDelete(note._id);
      onClose();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-3 sm:pb-4 border-b pr-8">
          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 break-words">
                {note.title}
              </DialogTitle>
              <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">By {note.createdBy.name || note.createdBy.email}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Created {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                </div>
                {note.updatedAt !== note.createdAt && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-3 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-6 bg-muted/50 rounded-lg border">
          <div className="prose prose-sm sm:prose-base prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base break-words">
              {note.content}
            </p>
          </div>
        </div>
        
        {canDelete && (
          <div className="flex justify-end pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
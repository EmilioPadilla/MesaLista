import { useCurrentUser } from 'hooks/useUser';
import { Avatar, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

export const UserProfile = () => {
  const { data: userData, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="mb-6 flex flex-col items-center">
        <Skeleton.Avatar active size={70} shape="circle" />
        <Skeleton.Input active size="small" className="mt-2" />
        <Skeleton.Input active size="small" className="mt-1" />
      </div>
    );
  }

  if (!userData) return null;

  // Cast the user data to UserBase type to access the new fields
  const user = userData;

  // Format the wedding date if available
  const formattedDate = user.weddingDate ? format(new Date(user.weddingDate), 'MMMM d, yyyy') : '';

  // Get first name and spouse first name from user data
  const firstName = user.firstName || '';
  const spouseFirstName = user.spouseFirstName || null;

  return (
    <div className="mb-6 grid grid-cols-6">
      <div className="col-span-2 flex items-center">
        <Avatar size={50} src={user.imageUrl || undefined} icon={!user.imageUrl ? <UserOutlined /> : undefined} className="mb-2" />
      </div>
      <div className="flex flex-col col-span-4">
        <p className="font-bold text-base mb-0">
          {firstName} {spouseFirstName ? `& ${spouseFirstName}` : ''}
        </p>
        {formattedDate && <p className="text-xs text-gray-600 mb-0">{formattedDate}</p>}
        {user.weddingLocation && <p className="text-xs text-gray-600">{user.weddingLocation}</p>}
      </div>
    </div>
  );
};

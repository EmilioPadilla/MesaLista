import { Outlet } from 'react-router-dom';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { TopNavWrapper } from 'src/app/modules/navigation/topnav/TopNavWrapper';

export function PublicLayout() {
  return (
    <>
      <TopNav />
      <TopNavWrapper>
        <Outlet />
      </TopNavWrapper>
    </>
  );
}

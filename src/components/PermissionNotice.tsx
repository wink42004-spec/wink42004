import { Result } from 'antd';
import { useAuthContext } from '../context/AuthContext';

export function PermissionNotice() {
  const { currentUser } = useAuthContext();

  if (currentUser.status === 'pending') {
    return (
      <Result
        status="info"
        title="账号待审核"
        subTitle="你已完成注册。请联系 wyt 审核开通权限，审核通过后即可查看公司真实数据。"
      />
    );
  }

  if (currentUser.status === 'rejected') {
    return (
      <Result
        status="warning"
        title="审核未通过"
        subTitle="当前账号暂时不能查看公司真实数据，如需开通请联系 wyt。"
      />
    );
  }

  return null;
}

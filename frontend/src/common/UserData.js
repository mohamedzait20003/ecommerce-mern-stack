import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const UserData = () => {
  const userState = useSelector(state => state?.user?.user);
  const [user, setUser] = useState(userState);

  useEffect(() => {
    setUser(userState);
  }, [userState]);

  return user;
};

export default UserData;
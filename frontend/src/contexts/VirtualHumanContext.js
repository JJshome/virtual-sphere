import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getVirtualHumans, createVirtualHuman, updateVirtualHuman, deleteVirtualHuman } from '../services/virtualHumanService';
import { useSnackbar } from './SnackbarContext';

const VirtualHumanContext = createContext();

export const useVirtualHuman = () => useContext(VirtualHumanContext);

export const VirtualHumanProvider = ({ children }) => {
  const [virtualHumans, setVirtualHumans] = useState([]);
  const [selectedVirtualHuman, setSelectedVirtualHuman] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, token } = useAuth();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (isAuthenticated) {
      fetchVirtualHumans();
    }
  }, [isAuthenticated]);

  const fetchVirtualHumans = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await getVirtualHumans();
      
      if (response.success) {
        setVirtualHumans(response.data.virtualHumans || []);
      } else {
        showSnackbar('가상 휴먼 목록을 가져오는 데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('가상 휴먼 목록 가져오기 오류:', error);
      showSnackbar('가상 휴먼 목록을 가져오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addVirtualHuman = async (virtualHumanData) => {
    setLoading(true);
    try {
      const response = await createVirtualHuman(virtualHumanData);
      
      if (response.success) {
        setVirtualHumans([...virtualHumans, response.data.virtualHuman]);
        showSnackbar('가상 휴먼이 성공적으로 생성되었습니다.', 'success');
        return { success: true, virtualHuman: response.data.virtualHuman };
      } else {
        showSnackbar(response.message || '가상 휴먼 생성에 실패했습니다.', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('가상 휴먼 생성 오류:', error);
      showSnackbar('가상 휴먼 생성 중 오류가 발생했습니다.', 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateVirtualHumanData = async (id, virtualHumanData) => {
    setLoading(true);
    try {
      const response = await updateVirtualHuman(id, virtualHumanData);
      
      if (response.success) {
        setVirtualHumans(virtualHumans.map(vh => 
          vh._id === id ? response.data.virtualHuman : vh
        ));
        
        if (selectedVirtualHuman && selectedVirtualHuman._id === id) {
          setSelectedVirtualHuman(response.data.virtualHuman);
        }
        
        showSnackbar('가상 휴먼이 성공적으로 업데이트되었습니다.', 'success');
        return { success: true, virtualHuman: response.data.virtualHuman };
      } else {
        showSnackbar(response.message || '가상 휴먼 업데이트에 실패했습니다.', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('가상 휴먼 업데이트 오류:', error);
      showSnackbar('가상 휴먼 업데이트 중 오류가 발생했습니다.', 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const removeVirtualHuman = async (id) => {
    setLoading(true);
    try {
      const response = await deleteVirtualHuman(id);
      
      if (response.success) {
        setVirtualHumans(virtualHumans.filter(vh => vh._id !== id));
        
        if (selectedVirtualHuman && selectedVirtualHuman._id === id) {
          setSelectedVirtualHuman(null);
        }
        
        showSnackbar('가상 휴먼이 성공적으로 삭제되었습니다.', 'success');
        return { success: true };
      } else {
        showSnackbar(response.message || '가상 휴먼 삭제에 실패했습니다.', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('가상 휴먼 삭제 오류:', error);
      showSnackbar('가상 휴먼 삭제 중 오류가 발생했습니다.', 'error');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const selectVirtualHuman = (virtualHuman) => {
    setSelectedVirtualHuman(virtualHuman);
  };

  return (
    <VirtualHumanContext.Provider
      value={{
        virtualHumans,
        selectedVirtualHuman,
        loading,
        fetchVirtualHumans,
        addVirtualHuman,
        updateVirtualHumanData,
        removeVirtualHuman,
        selectVirtualHuman
      }}
    >
      {children}
    </VirtualHumanContext.Provider>
  );
};

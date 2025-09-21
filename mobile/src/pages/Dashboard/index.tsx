import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { View } from 'react-native';

import api from '../../services/api';
import { useAuth } from '../../hooks/auth';
import { createNameInitials, processProvidersArray } from '../../utils/providerUtils';

import * as S from './styles';

export interface IProvider {
  id: string;
  name: string;
  avatar_url: string;
  nameInitials?: string;
}

const Dashboard: React.FC = () => {
  const [providers, setProviders] = useState<IProvider[]>([]);
  const { user, signOut } = useAuth();
  const { navigate } = useNavigation();

  const nameInitials = useMemo(() => createNameInitials(user.name), [user.name]);

  const navigateToProfile = useCallback(() => {
    navigate('Profile');
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const navigateToCreateAppointment = useCallback(
    (providerId: string) => {
      navigate('CreateAppointment', { providerId });
    },
    [navigate],
  );

  const loadProviders = useCallback(async () => {
    try {
      const response = await api.get<IProvider[]>('providers');
      const processedProviders = processProvidersArray(response.data);
      setProviders(processedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const renderProviderAvatar = useCallback((provider: IProvider) => {
    if (provider.avatar_url) {
      return <S.ProviderAvatar source={{ uri: provider.avatar_url }} />;
    }
    return (
      <S.ProviderInitialsContainer>
        <S.ProviderInitials>{provider.nameInitials}</S.ProviderInitials>
      </S.ProviderInitialsContainer>
    );
  }, []);

  const renderProviderInfo = useCallback((provider: IProvider) => (
    <S.ProviderInfo>
      <S.ProviderName>{provider.name}</S.ProviderName>
      <S.ProviderMeta>
        <Icon name="calendar" size={14} color="#ff9000" />
        <S.ProviderMetaText>segunda à sexta</S.ProviderMetaText>
      </S.ProviderMeta>
      <S.ProviderMeta>
        <Icon name="clock" size={14} color="#ff9000" />
        <S.ProviderMetaText>8h às 18h</S.ProviderMetaText>
      </S.ProviderMeta>
    </S.ProviderInfo>
  ), []);

  const renderProviderItem = useCallback(({ item: provider }: { item: IProvider }) => (
    <S.ProviderContainer
      onPress={() => navigateToCreateAppointment(provider.id)}
    >
      {renderProviderAvatar(provider)}
      {renderProviderInfo(provider)}
    </S.ProviderContainer>
  ), [navigateToCreateAppointment, renderProviderAvatar, renderProviderInfo]);

  const renderUserAvatar = useCallback(() => {
    if (user.avatar_url) {
      return <S.UserAvatar source={{ uri: user.avatar_url }} />;
    }
    return (
      <S.UserInitialsContainer>
        <S.UserInitials>{nameInitials}</S.UserInitials>
      </S.UserInitialsContainer>
    );
  }, [user.avatar_url, nameInitials]);

  const renderListFooter = useCallback(() => (
    <View style={{ marginBottom: 32 }} />
  ), []);

  const renderListHeader = useCallback(() => (
    <S.ProvidersListTitle>Cabeleireiros</S.ProvidersListTitle>
  ), []);

  return (
    <S.Container>
      <S.Header>
        <S.HeaderTitle>
          Bem vindo, {'\n'}
          <S.UserName>{user.name}</S.UserName>
        </S.HeaderTitle>

        <S.ProfileButton onPress={navigateToProfile}>
          {renderUserAvatar()}
        </S.ProfileButton>

        <S.SignOutButton onPress={handleSignOut}>
          <Icon name="log-out" color="#ff9000" size={20} />
        </S.SignOutButton>
      </S.Header>

      <S.ProvidersList
        data={providers}
        keyExtractor={provider => provider.id}
        ListFooterComponent={renderListFooter}
        ListHeaderComponent={renderListHeader}
        renderItem={renderProviderItem}
      />
    </S.Container>
  );
};

export default Dashboard;

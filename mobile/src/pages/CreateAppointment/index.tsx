import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../../hooks/auth';
import { IProvider } from '../Dashboard';
import api from '../../services/api';
import { createNameInitials, processProvidersArray } from '../../utils/providerUtils';

import * as S from './styles';

interface IRouteParams {
  providerId: string;
}

interface IAvailabilityItem {
  hour: number;
  available: boolean;
}

interface IFormattedAvailability {
  hour: number;
  available: boolean;
  formattedHour: string;
}

const CreateAppointment: React.FC = () => {
  const route = useRoute();
  const routeParams = route.params as IRouteParams;
  const { user } = useAuth();
  const { goBack, navigate } = useNavigation();
  const [availability, setAvailability] = useState<IAvailabilityItem[]>([]);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );

  const nameInitials = useMemo(() => createNameInitials(user.name), [user.name]);

  const loadProviders = useCallback(async () => {
    try {
      const response = await api.get<IProvider[]>('providers');
      const processedProviders = processProvidersArray(response.data);
      setProviders(processedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      const response = await api.get(`providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      });
      setAvailability(response.data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  }, [selectedDate, selectedProvider]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const formatAvailabilityHours = useCallback((items: IAvailabilityItem[]): IFormattedAvailability[] => {
    return items.map(({ hour, available }) => ({
      hour,
      available,
      formattedHour: format(new Date().setHours(hour), 'HH:00'),
    }));
  }, []);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker(oldValue => !oldValue);
  }, []);

  const handleChangeDate = useCallback((event: any, date: Date | undefined) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  }, []);

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  const createAppointment = useCallback(async () => {
    const date = new Date(selectedDate);
    date.setHours(selectedHour);
    date.setMinutes(0);

    await api.post('appointments', {
      provider_id: selectedProvider,
      date,
    });

    navigate('AppointmentCreated', { date: date.getTime() });
  }, [navigate, selectedHour, selectedProvider, selectedDate]);

  const handleCreateAppointment = useCallback(async () => {
    try {
      await createAppointment();
    } catch (error) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar o agendamento, tente novamente',
      );
    }
  }, [createAppointment]);

  const morningAvailability = useMemo(() => {
    const morningSlots = availability.filter(({ hour }) => hour < 12);
    return formatAvailabilityHours(morningSlots);
  }, [availability, formatAvailabilityHours]);

  const afternoonAvailability = useMemo(() => {
    const afternoonSlots = availability.filter(({ hour }) => hour >= 12);
    return formatAvailabilityHours(afternoonSlots);
  }, [availability, formatAvailabilityHours]);

  const renderProviderItem = useCallback(({ item: provider }: { item: IProvider }) => (
    <S.ProviderContainer
      onPress={() => handleSelectProvider(provider.id)}
      selected={provider.id === selectedProvider}
    >
      {provider.avatar_url ? (
        <S.ProviderAvatar
          selected={provider.id === selectedProvider}
          source={{ uri: provider.avatar_url }}
        />
      ) : (
        <S.ProviderInitialsContainer
          selected={provider.id === selectedProvider}
        >
          <S.ProviderInitials>
            {provider.nameInitials}
          </S.ProviderInitials>
        </S.ProviderInitialsContainer>
      )}
      <S.ProviderName selected={provider.id === selectedProvider}>
        {provider.name}
      </S.ProviderName>
    </S.ProviderContainer>
  ), [handleSelectProvider, selectedProvider]);

  const renderHourItem = useCallback(({ formattedHour, available, hour }: IFormattedAvailability) => (
    <S.Hour
      enabled={available}
      selected={selectedHour === hour}
      onPress={() => handleSelectHour(hour)}
      available={available}
      key={formattedHour}
    >
      <S.HourText selected={selectedHour === hour}>
        {formattedHour}
      </S.HourText>
    </S.Hour>
  ), [selectedHour, handleSelectHour]);

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

  return (
    <S.Container>
      <S.Header>
        <S.BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </S.BackButton>

        <S.HeaderTitle>Cabeleireiros</S.HeaderTitle>

        {renderUserAvatar()}
      </S.Header>

      <S.Content>
        <S.ProvidersListContainer>
          <S.ProvidersList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={provider => provider.id}
            renderItem={renderProviderItem}
          />
        </S.ProvidersListContainer>

        <S.Calendar>
          <S.Title>Escolha a data</S.Title>

          <S.OpenDatePickerButton onPress={handleToggleDatePicker}>
            <S.OpenDatePickerButtonText>
              Selecionar outra data
            </S.OpenDatePickerButtonText>
          </S.OpenDatePickerButton>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display="calendar"
              textColor="#f4ede8"
              value={selectedDate}
              onChange={handleChangeDate}
            />
          )}
        </S.Calendar>

        <S.Schedule>
          <S.Title>Escolha o horário</S.Title>

          <S.Section>
            <S.SectionTitle>Manhã</S.SectionTitle>
            <S.SectionContent>
              {morningAvailability.map(renderHourItem)}
            </S.SectionContent>
          </S.Section>
          
          <S.Section>
            <S.SectionTitle>Tarde</S.SectionTitle>
            <S.SectionContent>
              {afternoonAvailability.map(renderHourItem)}
            </S.SectionContent>
          </S.Section>
        </S.Schedule>

        <S.CreateAppointmentButton onPress={handleCreateAppointment}>
          <S.CreateAppointmentButtonText>Agendar</S.CreateAppointmentButtonText>
        </S.CreateAppointmentButton>
      </S.Content>
    </S.Container>
  );
};

export default CreateAppointment;

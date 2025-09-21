import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from 'react';
import { isToday, format, parseISO, isAfter } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import DayPicker, { DayModifiers } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { FiPower, FiClock } from 'react-icons/fi';
import { FaMoon, FaSun } from 'react-icons/fa';
import Toggle from 'react-toggle';
import { ThemeContext } from 'styled-components';
import { Link } from 'react-router-dom';

import logoLight from '../../assets/logo-light.svg';
import logo from '../../assets/logo.svg';
import { useTheme } from '../../hooks/theme';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';
import { createNameInitials, formatAppointmentData } from '../../utils/providerUtils';

import {
  Container,
  Header,
  HeaderContent,
  Profile,
  Avatar,
  Content,
  Schedule,
  NextAppointment,
  Section,
  Appointment,
  Initials,
  Calendar,
} from './styles';

interface MonthAvailabilityItem {
  day: number;
  available: boolean;
}

interface Appointment {
  id: string;
  date: string;
  formattedHour: string;
  user: {
    name: string;
    avatar_url: string;
  };
}

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const { title } = useContext(ThemeContext);
  const { toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [monthAvailability, setMonthAvailability] = useState<
    MonthAvailabilityItem[]
  >([]);

  const nameInitials = useMemo(() => createNameInitials(user.name), [user.name]);

  const handleDateChange = useCallback((day: Date, modifiers: DayModifiers) => {
    if (modifiers.available && !modifiers.disabled) {
      setSelectedDate(day);
    }
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);

  const loadMonthAvailability = useCallback(async () => {
    try {
      const response = await api.get(`/providers/${user.id}/month-availability`, {
        params: {
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
        },
      });
      setMonthAvailability(response.data);
    } catch (error) {
      console.error('Error loading month availability:', error);
    }
  }, [currentMonth, user.id]);

  const loadAppointments = useCallback(async () => {
    try {
      const response = await api.get<Appointment[]>('/appointments/me', {
        params: {
          day: selectedDate.getDate(),
          month: selectedDate.getMonth() + 1,
          year: selectedDate.getFullYear(),
        },
      });
      
      const formattedAppointments = response.data.map(appointment => ({
        ...formatAppointmentData(appointment),
        formattedHour: format(parseISO(appointment.date), 'HH:mm'),
      }));
      
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadMonthAvailability();
  }, [loadMonthAvailability]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const disabledDays = useMemo(() => {
    return monthAvailability
      .filter(monthDay => monthDay.available === false)
      .map(monthDay => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return new Date(year, month, monthDay.day);
      });
  }, [currentMonth, monthAvailability]);

  const selectedDateAsText = useMemo(() => {
    return format(selectedDate, "'Dia' dd 'de' MMMM", {
      locale: ptBR,
    });
  }, [selectedDate]);

  const selectedWeekDay = useMemo(() => {
    return format(selectedDate, 'cccc', {
      locale: ptBR,
    });
  }, [selectedDate]);

  const morningAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      return parseISO(appointment.date).getHours() < 12;
    });
  }, [appointments]);

  const afternoonAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      return parseISO(appointment.date).getHours() >= 12;
    });
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    return appointments.find(appointment =>
      isAfter(parseISO(appointment.date), new Date()),
    );
  }, [appointments]);

  const renderUserAvatar = useCallback(() => {
    if (user.avatar_url) {
      return <img src={user.avatar_url} alt={user.name} />;
    }
    return <p>{nameInitials}</p>;
  }, [user.avatar_url, user.name, nameInitials]);

  const renderAppointmentAvatar = useCallback((appointment: Appointment) => {
    const isInitials = appointment.user.avatar_url.length === 2;
    
    if (isInitials) {
      return (
        <Initials>
          <span>{appointment.user.avatar_url}</span>
        </Initials>
      );
    }
    
    return (
      <img
        src={appointment.user.avatar_url}
        alt={appointment.user.name}
      />
    );
  }, []);

  const renderAppointmentItem = useCallback((appointment: Appointment) => (
    <Appointment key={appointment.id}>
      <span>
        <FiClock />
        {appointment.formattedHour}
      </span>
      <div>
        {renderAppointmentAvatar(appointment)}
        <strong>{appointment.user.name}</strong>
      </div>
    </Appointment>
  ), [renderAppointmentAvatar]);

  const renderNextAppointment = useCallback(() => {
    if (!isToday(selectedDate) || !nextAppointment) {
      return null;
    }

    return (
      <NextAppointment>
        <strong>Atendimento a seguir</strong>
        <div>
          {renderAppointmentAvatar(nextAppointment)}
          <strong>{nextAppointment.user.name}</strong>
          <span>
            <FiClock />
            {nextAppointment.formattedHour}
          </span>
        </div>
      </NextAppointment>
    );
  }, [selectedDate, nextAppointment, renderAppointmentAvatar]);

  const renderAppointmentSection = useCallback((title: string, appointmentList: Appointment[]) => (
    <Section>
      <strong>{title}</strong>
      {!appointmentList.length && (
        <p>Nenhum agendamento neste período</p>
      )}
      {appointmentList.map(renderAppointmentItem)}
    </Section>
  ), [renderAppointmentItem]);

  const renderLogo = useCallback(() => {
    return title === 'light' ? (
      <img src={logoLight} alt="GoBarber" />
    ) : (
      <img src={logo} alt="GoBarber" />
    );
  }, [title]);

  const renderToggleIcons = useMemo(() => ({
    checked: <FaMoon color="yellow" size={12} />,
    unchecked: <FaSun color="yellow" size={12} />,
  }), []);

  return (
    <Container>
      <Header>
        <HeaderContent>
          {renderLogo()}

          <Profile>
            <Avatar>
              {renderUserAvatar()}
            </Avatar>

            <div>
              <span>Bem-vindo,</span>
              <Link to="/profile">
                <strong>{user.name}</strong>
              </Link>
            </div>
          </Profile>

          <Toggle
            checked={title === 'dark'}
            onChange={toggleTheme}
            className="toggle"
            icons={renderToggleIcons}
          />

          <button type="button" onClick={signOut}>
            <FiPower />
          </button>
        </HeaderContent>
      </Header>

      <Content>
        <Schedule>
          <h1>Horários agendados</h1>
          <p>
            {isToday(selectedDate) && <span>Hoje</span>}
            <span>{selectedDateAsText}</span>
            <span>{selectedWeekDay}</span>
          </p>

          {renderNextAppointment()}
          {renderAppointmentSection('Manhã', morningAppointments)}
          {renderAppointmentSection('Tarde', afternoonAppointments)}
        </Schedule>
        
        <Calendar>
          <DayPicker
            weekdaysShort={['D', 'S', 'T', 'Q', 'Q', 'S', 'S']}
            fromMonth={new Date()}
            disabledDays={[{ daysOfWeek: [0, 6] }, ...disabledDays]}
            selectedDays={selectedDate}
            onMonthChange={handleMonthChange}
            modifiers={{
              available: { daysOfWeek: [1, 2, 3, 4, 5] },
            }}
            onDayClick={handleDateChange}
            months={[
              'Janeiro',
              'Fevereiro',
              'Março',
              'Abril',
              'Maio',
              'Junho',
              'Julho',
              'Agosto',
              'Setembro',
              'Outubro',
              'Novembro',
              'Desembro',
            ]}
          />
        </Calendar>
      </Content>
    </Container>
  );
};

export default Dashboard;

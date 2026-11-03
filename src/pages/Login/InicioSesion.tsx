import React, { useState } from 'react';
import { Lock, User, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useContextoAuth } from '../../context/ContextoAuth';
import { LoginRequest } from '../../services/usuarios.service';
import styles from './InicioSesion.module.css';

export const InicioSesion: React.FC = () => {
  const { login } = useContextoAuth();

  const [credenciales, setCredenciales] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credenciales.username.trim() || !credenciales.password) {
      setError('Ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({
        username: credenciales.username.trim(),
        password: credenciales.password,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Verifica tus credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.loginCard}>
        <div className={styles.brandHeader}>
          <div className={styles.brandLogo}>
            <span>P</span>
          </div>
          <h1 className={styles.title}>Librería TOFOR · EduStock</h1>
          <p className={styles.subtitle}>
            Inicia sesión con tus credenciales para continuar
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-username">
              Usuario
            </label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                id="login-username"
                type="text"
                className={styles.input}
                placeholder="Ej. nelly o rquispe"
                autoComplete="username"
                value={credenciales.username}
                onChange={(e) =>
                  setCredenciales((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="login-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                value={credenciales.password}
                onChange={(e) =>
                  setCredenciales((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InicioSesion;

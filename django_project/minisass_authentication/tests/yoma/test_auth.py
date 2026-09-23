import json
from unittest.mock import patch, Mock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from constance.test import override_config
from minisass_authentication.models.yoma import YomaToken

User = get_user_model()


class YomaAuthTestCase(APITestCase):
    """Base test case for YOMA authentication tests."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='john@example.com',
            email='john@example.com',
            password='testpass123'
        )

        # Sample YOMA token response
        self.sample_token_response = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWJjMTIzIiwic2NvcGVzIjpbInJlYWQiLCJ3cml0ZSJdLCJleHAiOjE2OTAwODAzOTl9.PxKm3vKQg...signature",
            "expires_in": 300,
            "refresh_expires_in": 1800,
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWJjMTIzIiwidHlwIjoiUmVmcmVzaCIsImlhdCI6MTY4OTk5OTk5OSwiZXhwIjoxNzI1OTk5OTk5fQ.Y2YtZT...signature",
            "token_type": "Bearer",
            "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNjg5OTk5OTk5LCJleHAiOjE3MDAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            "not-before-policy": 0,
            "session_state": "xyz456",
            "scope": "openid email profile yoma-api phone"
        }


class YomaAuthInitiateViewTest(YomaAuthTestCase):
    """Test cases for YomaAuthInitiateView."""

    def test_get_auth_url_success(self):
        """Test successful generation of YOMA auth URL."""
        url = reverse('yoma-initiate')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('auth_url', response.data)
        self.assertIn('client_id', response.data)
        self.assertIn('redirect_uri', response.data)
        self.assertIn('scope', response.data)

        # Check auth URL format
        auth_url = response.data['auth_url']
        self.assertIn('https://dummystage.yoma.world/auth/realms/yoma/protocol/openid-connect/auth', auth_url)
        self.assertIn('client_id=test_client_id', auth_url)
        self.assertIn('response_type=code', auth_url)
        self.assertIn('scope=openid', auth_url)

    @override_config(YOMA_CLIENT_ID='')
    def test_get_auth_url_missing_client_id(self):
        """Test error when client ID is not configured."""
        url = reverse('yoma-initiate')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'configuration_error')


class YomaAuthCallbackViewTest(YomaAuthTestCase):
    """Test cases for YomaAuthCallbackView."""

    def setUp(self):
        """Set up authenticated user for callback tests."""
        super().setUp()
        self.client.force_authenticate(user=self.user)

    @patch('minisass_authentication.views.yoma_auth.requests.post')
    def test_callback_success(self, mock_post):
        """Test successful YOMA callback with token exchange."""
        # Mock successful token exchange response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.sample_token_response
        mock_post.return_value = mock_response

        url = reverse('yoma-callback')
        response = self.client.get(url, {
            'code': 'test_auth_code',
            'session_state': 'test_session_state'
        })

        self.assertEqual(response.status_code, 302)

        # Verify token was stored in database
        yoma_token = YomaToken.objects.get(user=self.user)
        self.assertEqual(yoma_token.access_token, self.sample_token_response['access_token'])
        self.assertEqual(yoma_token.token_type, 'Bearer')
        self.assertEqual(yoma_token.scope, 'openid email profile yoma-api phone')
        self.assertEqual(yoma_token.session_state, 'test_session_state')

        # Verify token exchange request was made correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertEqual(call_args[0][0], 'https://dummystage.yoma.world/auth/realms/yoma/protocol/openid-connect/token')
        self.assertEqual(call_args[1]['data']['grant_type'], 'authorization_code')
        self.assertEqual(call_args[1]['data']['code'], 'test_auth_code')

    def test_callback_missing_code(self):
        """Test callback error when authorization code is missing."""
        url = reverse('yoma-callback')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'missing_code')

    def test_callback_oauth_error(self):
        """Test callback with OAuth error parameters."""
        url = reverse('yoma-callback')
        response = self.client.get(url, {
            'error': 'access_denied',
            'error_description': 'User denied access'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'access_denied')
        self.assertEqual(response.data['error_description'], 'User denied access')

    @patch('minisass_authentication.views.yoma_auth.requests.post')
    def test_callback_token_exchange_error(self, mock_post):
        """Test callback when token exchange fails."""
        # Mock failed token exchange response
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            'error': 'invalid_grant',
            'error_description': 'Invalid authorization code'
        }
        mock_post.return_value = mock_response

        url = reverse('yoma-callback')
        response = self.client.get(url, {'code': 'invalid_code'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'invalid_grant')

    @override_config(YOMA_CLIENT_ID='', YOMA_CLIENT_SECRET='')
    def test_callback_missing_credentials(self):
        """Test callback error when credentials are not configured."""
        url = reverse('yoma-callback')
        response = self.client.get(url, {'code': 'test_code'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'configuration_error')

    @patch('minisass_authentication.views.yoma_auth.requests.post')
    def test_callback_network_error(self, mock_post):
        """Test callback when network error occurs during token exchange."""
        # Mock network error
        mock_post.side_effect = Exception("Network error")

        url = reverse('yoma-callback')
        response = self.client.get(url, {'code': 'test_code'})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error'], 'token_exchange_failed')

    @patch('minisass_authentication.views.yoma_auth.requests.post')
    def test_callback_token_update(self, mock_post):
        """Test callback updates existing token for user."""
        # Create existing token
        existing_token = YomaToken.objects.create(
            user=self.user,
            access_token='old_token',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=300),
            scope='openid email'
        )

        # Mock successful token exchange response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.sample_token_response
        mock_post.return_value = mock_response

        url = reverse('yoma-callback')
        response = self.client.get(url, {
            'code': 'new_auth_code',
            'session_state': 'new_session_state'
        })

        self.assertEqual(response.status_code, 302)

        # Verify token was updated, not created new
        self.assertEqual(YomaToken.objects.filter(user=self.user).count(), 1)
        updated_token = YomaToken.objects.get(user=self.user)
        self.assertEqual(updated_token.access_token, self.sample_token_response['access_token'])
        self.assertEqual(updated_token.session_state, 'new_session_state')


class YomaTokenStatusViewTest(YomaAuthTestCase):
    """Test cases for YomaTokenStatusView."""

    def setUp(self):
        """Set up authenticated user for status tests."""
        super().setUp()
        self.client.force_authenticate(user=self.user)

    def test_token_status_with_valid_token(self):
        """Test token status with valid token."""
        # Create valid token
        expires_at = timezone.now() + timedelta(seconds=300)
        refresh_expires_at = timezone.now() + timedelta(seconds=1800)

        yoma_token = YomaToken.objects.create(
            user=self.user,
            access_token='valid_token',
            refresh_token='valid_refresh_token',
            token_type='Bearer',
            expires_at=expires_at,
            refresh_expires_at=refresh_expires_at,
            scope='openid email profile yoma-api phone',
            session_state='test_session'
        )

        url = reverse('yoma-token-status')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_token'])
        self.assertTrue(response.data['is_valid'])
        self.assertFalse(response.data['is_access_token_expired'])
        self.assertFalse(response.data['is_refresh_token_expired'])
        self.assertEqual(response.data['scope'], 'openid email profile yoma-api phone')
        self.assertEqual(response.data['token_type'], 'Bearer')

    def test_token_status_with_expired_token(self):
        """Test token status with expired token."""
        # Create expired token
        expires_at = timezone.now() - timedelta(seconds=300)

        yoma_token = YomaToken.objects.create(
            user=self.user,
            access_token='expired_token',
            token_type='Bearer',
            expires_at=expires_at,
            scope='openid email'
        )

        url = reverse('yoma-token-status')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_token'])
        self.assertFalse(response.data['is_valid'])
        self.assertTrue(response.data['is_access_token_expired'])

    def test_token_status_no_token(self):
        """Test token status when user has no token."""
        url = reverse('yoma-token-status')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['has_token'])
        self.assertIn('message', response.data)


class YomaTokenModelTest(TestCase):
    """Test cases for YomaToken model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.sample_token_data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "expires_in": 300,
            "refresh_expires_in": 1800,
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
            "scope": "openid email profile yoma-api phone"
        }

    def test_create_token(self):
        """Test creating a new YOMA token."""
        expires_at = timezone.now() + timedelta(seconds=300)

        token = YomaToken.objects.create(
            user=self.user,
            access_token='test_access_token',
            refresh_token='test_refresh_token',
            token_type='Bearer',
            expires_at=expires_at,
            scope='openid email'
        )

        self.assertEqual(token.user, self.user)
        self.assertEqual(token.access_token, 'test_access_token')
        self.assertEqual(token.refresh_token, 'test_refresh_token')
        self.assertEqual(token.token_type, 'Bearer')
        self.assertEqual(token.scope, 'openid email')
        self.assertTrue(token.is_valid)
        self.assertFalse(token.is_access_token_expired)

    def test_token_expiry_properties(self):
        """Test token expiry property methods."""
        # Create expired access token
        expired_token = YomaToken.objects.create(
            user=self.user,
            access_token='expired_token',
            token_type='Bearer',
            expires_at=timezone.now() - timedelta(seconds=300),
            refresh_expires_at=timezone.now() + timedelta(seconds=300)
        )

        self.assertTrue(expired_token.is_access_token_expired)
        self.assertFalse(expired_token.is_valid)
        self.assertFalse(expired_token.is_refresh_token_expired)

        # Create token with expired refresh token
        refresh_expired_token = YomaToken.objects.create(
            user=User.objects.create_user(username='user2', email='user2@test.com'),
            access_token='valid_token',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=300),
            refresh_expires_at=timezone.now() - timedelta(seconds=300)
        )

        self.assertFalse(refresh_expired_token.is_access_token_expired)
        self.assertTrue(refresh_expired_token.is_valid)
        self.assertTrue(refresh_expired_token.is_refresh_token_expired)

    def test_create_or_update_token_new(self):
        """Test creating a new token using class method."""
        token = YomaToken.create_or_update_token(
            user=self.user,
            token_data=self.sample_token_data,
            session_state='test_session'
        )

        self.assertEqual(token.user, self.user)
        self.assertEqual(token.access_token, self.sample_token_data['access_token'])
        self.assertEqual(token.refresh_token, self.sample_token_data['refresh_token'])
        self.assertEqual(token.token_type, 'Bearer')
        self.assertEqual(token.scope, 'openid email profile yoma-api phone')
        self.assertEqual(token.session_state, 'test_session')
        self.assertTrue(token.is_valid)

        # Check expiry times are calculated correctly
        expected_expires_at = timezone.now() + timedelta(seconds=300)
        expected_refresh_expires_at = timezone.now() + timedelta(seconds=1800)

        # Allow for small time differences in test execution
        self.assertAlmostEqual(
            token.expires_at.timestamp(),
            expected_expires_at.timestamp(),
            delta=5
        )
        self.assertAlmostEqual(
            token.refresh_expires_at.timestamp(),
            expected_refresh_expires_at.timestamp(),
            delta=5
        )

    def test_create_or_update_token_existing(self):
        """Test updating an existing token using class method."""
        # Create initial token
        initial_token = YomaToken.objects.create(
            user=self.user,
            access_token='old_token',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=100),
            scope='openid'
        )

        # Update with new token data
        updated_token = YomaToken.create_or_update_token(
            user=self.user,
            token_data=self.sample_token_data,
            session_state='new_session'
        )

        # Should be the same object (updated, not created new)
        self.assertEqual(initial_token.id, updated_token.id)
        self.assertEqual(updated_token.access_token, self.sample_token_data['access_token'])
        self.assertEqual(updated_token.session_state, 'new_session')

        # Verify only one token exists for the user
        self.assertEqual(YomaToken.objects.filter(user=self.user).count(), 1)

    def test_token_string_representation(self):
        """Test token string representation."""
        token = YomaToken.objects.create(
            user=self.user,
            access_token='test_token',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=300)
        )

        self.assertEqual(str(token), f"YOMA Token for {self.user.username}")

    def test_token_without_refresh_expiry(self):
        """Test token behavior when refresh_expires_at is None."""
        token = YomaToken.objects.create(
            user=self.user,
            access_token='test_token',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=300),
            refresh_expires_at=None
        )

        # Should consider refresh token as expired when no expiry date
        self.assertTrue(token.is_refresh_token_expired)

    def test_token_meta_options(self):
        """Test model meta options."""
        self.assertEqual(YomaToken._meta.db_table, 'yoma_tokens')
        self.assertEqual(YomaToken._meta.verbose_name, 'YOMA Token')
        self.assertEqual(YomaToken._meta.verbose_name_plural, 'YOMA Tokens')
        self.assertEqual(YomaToken._meta.ordering, ['-created_at'])

    def test_one_to_one_relationship(self):
        """Test that user can only have one YOMA token."""
        # Create first token
        token1 = YomaToken.objects.create(
            user=self.user,
            access_token='token1',
            token_type='Bearer',
            expires_at=timezone.now() + timedelta(seconds=300)
        )

        # Try to create second token for same user - should raise error
        with self.assertRaises(Exception):
            YomaToken.objects.create(
                user=self.user,
                access_token='token2',
                token_type='Bearer',
                expires_at=timezone.now() + timedelta(seconds=300)
            )


class YomaAuthIntegrationTest(YomaAuthTestCase):
    """Integration tests for YOMA authentication flow."""

    def setUp(self):
        """Set up authenticated user for integration tests."""
        super().setUp()
        self.client.force_authenticate(user=self.user)

    def test_full_auth_flow(self):
        """Test complete YOMA authentication flow."""
        # Step 1: Get auth URL
        initiate_url = reverse('yoma-initiate')
        initiate_response = self.client.get(initiate_url)

        self.assertEqual(initiate_response.status_code, status.HTTP_200_OK)
        auth_url = initiate_response.data['auth_url']
        self.assertIn('client_id=test_client_id', auth_url)

        # Step 2: Simulate successful callback with token exchange
        with patch('minisass_authentication.views.yoma_auth.requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = self.sample_token_response
            mock_post.return_value = mock_response

            callback_url = reverse('yoma-callback')
            callback_response = self.client.get(callback_url, {
                'code': 'test_auth_code',
                'session_state': 'test_session_state'
            })

            # request is redirected
            self.assertEqual(callback_response.status_code, 302)

        # Step 3: Check token status
        status_url = reverse('yoma-token-status')
        status_response = self.client.get(status_url)

        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertTrue(status_response.data['has_token'])
        self.assertTrue(status_response.data['is_valid'])

        # Verify token exists in database
        token = YomaToken.objects.get(user=self.user)
        self.assertEqual(token.access_token, self.sample_token_response['access_token'])
        self.assertEqual(token.session_state, 'test_session_state')

    def test_auth_flow_error_handling(self):
        """Test error handling in authentication flow."""
        # Test callback with OAuth error
        callback_url = reverse('yoma-callback')
        error_response = self.client.get(callback_url, {
            'error': 'access_denied',
            'error_description': 'User cancelled authentication'
        })

        self.assertEqual(error_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_response.data['error'], 'access_denied')

        # Verify no token was created
        self.assertFalse(YomaToken.objects.filter(user=self.user).exists())

        # Check status shows no token
        status_url = reverse('yoma-token-status')
        status_response = self.client.get(status_url)

        self.assertEqual(status_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(status_response.data['has_token'])


class YomaSessionHandoffTest(APITestCase):
    """
    The handoff from a YOMA session to the SPA.

    This is the seam that broke YOMA single sign-on between August 2025 and
    March 2026, and nothing covered it. The callback logs the user in with
    django.contrib.auth.login(), which sets a *session cookie* and nothing else,
    then redirects to the home page. The SPA holds its auth state as a JWT, so
    the only thing that turns that session into a usable login is a call to
    check-auth-status, which accepts the session cookie and mints a fresh token
    pair.

    Two things therefore have to stay true, and each of these tests pins one:

      1. check-auth-status must authenticate on the session cookie alone, with
         no usable JWT presented. Removing CustomSessionAuthentication from that
         view would break SSO silently, with no error anywhere.
      2. It must return access and refresh tokens, because a YOMA user has no
         other way to obtain them and every later API call needs one.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='yoma-user@example.com',
            email='yoma-user@example.com',
            password='irrelevant-for-sso',
        )
        self.url = reverse('check-auth-status')

    def _login_like_the_yoma_callback(self):
        """Session only, exactly what YomaAuthCallbackView leaves behind."""
        self.client.force_login(
            self.user, backend='django.contrib.auth.backends.ModelBackend'
        )

    def test_session_alone_authenticates_with_no_usable_jwt(self):
        self._login_like_the_yoma_callback()

        # "dummy-token" is what the SPA sends when it holds no token of its own,
        # which is exactly the state a first-time YOMA user is in. It has to fail
        # JWT authentication so the session authenticator gets its turn.
        response = self.client.get(self.url, HTTP_AUTHORIZATION='Bearer dummy-token')

        self.assertEqual(
            response.status_code, 200,
            'a YOMA session must authenticate check-auth-status on its own',
        )
        self.assertTrue(response.data['is_authenticated'])
        self.assertEqual(response.data['username'], 'yoma-user@example.com')

    def test_session_login_returns_tokens_the_spa_can_use(self):
        self._login_like_the_yoma_callback()

        response = self.client.get(self.url, HTTP_AUTHORIZATION='Bearer dummy-token')

        self.assertEqual(response.status_code, 200)
        for key in ('access_token', 'refresh_token'):
            self.assertTrue(
                response.data.get(key),
                f'{key} is missing, so a YOMA user could never call the API',
            )

    def test_without_a_session_the_endpoint_still_refuses(self):
        """The fix must not turn this into an open endpoint."""
        response = self.client.get(self.url, HTTP_AUTHORIZATION='Bearer dummy-token')

        self.assertEqual(response.status_code, 401)

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django import forms
from django.contrib.auth.models import User
import calendar
from datetime import datetime, date
from django.utils import timezone

class UserProfileForm(forms.ModelForm):
	email = forms.EmailField(required=True)

	class Meta:
		model = User
		fields = ['username', 'first_name', 'last_name', 'email']

	def clean_email(self):
		email = self.cleaned_data.get('email')
		if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
			raise forms.ValidationError("A user with this email already exists.")
		return email

	def clean_username(self):
		username = self.cleaned_data.get('username')
		if User.objects.filter(username=username).exclude(pk=self.instance.pk).exists():
			raise forms.ValidationError("A user with this username already exists.")
		return username

def home(request):
	context = {}
	if request.user.is_authenticated:
		today = timezone.now().date()
		year = int(request.GET.get('year', today.year))
		month = int(request.GET.get('month', today.month))

		# Create calendar
		cal = calendar.monthcalendar(year, month)
		month_name = calendar.month_name[month]

		# Calculate previous and next month
		if month == 1:
			prev_month = 12
			prev_year = year - 1
		else:
			prev_month = month - 1
			prev_year = year

		if month == 12:
			next_month = 1
			next_year = year + 1
		else:
			next_month = month + 1
			next_year = year

		context = {
			'calendar': cal,
			'month_name': month_name,
			'year': year,
			'month': month,
			'today': today,
			'prev_month': prev_month,
			'prev_year': prev_year,
			'next_month': next_month,
			'next_year': next_year,
		}

	return render(request, 'home.html', context)

def register_view(request):
	if request.method == 'POST':
		form = UserCreationForm(request.POST)
		if form.is_valid():
			user = form.save()
			username = form.cleaned_data.get('username')
			messages.success(request, f'Account created for {username}!')
			login(request, user)
			return redirect('home')
	else:
		form = UserCreationForm()
	return render(request, 'registration/register.html', {'form': form})

def login_view(request):
	if request.method == 'POST':
		form = AuthenticationForm(request, data=request.POST)
		if form.is_valid():
			username = form.cleaned_data.get('username')
			password = form.cleaned_data.get('password')
			user = authenticate(username=username, password=password)
			if user is not None:
				login(request, user)
				messages.info(request, f"You are now logged in as {username}.")
				return redirect('home')
			else:
				messages.error(request, "Invalid username or password.")
		else:
			messages.error(request, "Invalid username or password.")
	form = AuthenticationForm()
	return render(request, 'registration/login.html', {'form': form})

def logout_view(request):
	logout(request)
	messages.info(request, "You have successfully logged out.")
	return redirect('home')

@login_required
def daily_tasks(request, year, month, day):
	from .models import Task

	selected_date = date(year, month, day)

	if request.method == 'POST':
		hour = int(request.POST.get('hour'))
		title = request.POST.get('title', '').strip()
		description = request.POST.get('description', '').strip()
		priority = request.POST.get('priority', 'medium')
		completed = request.POST.get('completed') == 'on'

		if title:  # Only save if title is provided
			task, created = Task.objects.get_or_create(
				user=request.user,
				date=selected_date,
				hour=hour,
				defaults={
					'title': title,
					'description': description,
					'priority': priority,
					'completed': completed,
				}
			)
			if not created:
				# Update existing task
				task.title = title
				task.description = description
				task.priority = priority
				task.completed = completed
				task.save()

			messages.success(request, f"Task saved for {hour:02d}:00!")
		else:
			# Delete task if title is empty
			Task.objects.filter(
				user=request.user,
				date=selected_date,
				hour=hour
			).delete()
			messages.info(request, f"Task removed for {hour:02d}:00!")

		return redirect('daily_tasks', year=year, month=month, day=day)

	# Get existing tasks for this day
	tasks = Task.objects.filter(user=request.user, date=selected_date)
	tasks_by_hour = {task.hour: task for task in tasks}

	# Create hourly schedule from 4am to 11pm
	hours = range(4, 24)  # 4am to 11pm (23:00)
	schedule = []

	for hour in hours:
		task = tasks_by_hour.get(hour)
		schedule.append({
			'hour': hour,
			'hour_display': f"{hour:02d}:00",
			'hour_12': f"{hour%12 or 12}:00 {'AM' if hour < 12 else 'PM'}",
			'task': task,
		})

	context = {
		'selected_date': selected_date,
		'formatted_date': selected_date.strftime('%A, %B %d, %Y'),
		'schedule': schedule,
		'year': year,
		'month': month,
		'day': day,
	}
	return render(request, 'daily_tasks.html', context)

@login_required
def profile_view(request):
	if request.method == 'POST':
		form_type = request.POST.get('form_type')

		if form_type == 'profile':
			profile_form = UserProfileForm(request.POST, instance=request.user)
			password_form = PasswordChangeForm(request.user)

			if profile_form.is_valid():
				profile_form.save()
				messages.success(request, 'Profile updated successfully!')
				return redirect('profile')
			else:
				messages.error(request, 'Please correct the errors below.')

		elif form_type == 'password':
			profile_form = UserProfileForm(instance=request.user)
			password_form = PasswordChangeForm(request.user, request.POST)

			if password_form.is_valid():
				user = password_form.save()
				update_session_auth_hash(request, user)  # Keep user logged in after password change
				messages.success(request, 'Password changed successfully!')
				return redirect('profile')
			else:
				messages.error(request, 'Please correct the password errors below.')
	else:
		profile_form = UserProfileForm(instance=request.user)
		password_form = PasswordChangeForm(request.user)

	context = {
		'profile_form': profile_form,
		'password_form': password_form,
	}
	return render(request, 'profile.html', context)

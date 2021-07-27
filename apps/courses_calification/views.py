from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth.decorators import login_required
from .models import Calification
from apps.courses_calification.models import Course
from rest_framework import serializers
from django.core.cache import cache


class CalificationSearializer(serializers.Serializer):
    year = serializers.IntegerField(min_value=1900, max_value=2200, required=True)
    semester = serializers.IntegerField(min_value=1, max_value=2, required=True)
    like = serializers.IntegerField(min_value=1, max_value=5, required=True)
    load = serializers.IntegerField(min_value=1, max_value=5, required=True)
    online_adaptation = serializers.IntegerField(
        min_value=1, max_value=5, required=True
    )
    communication = serializers.IntegerField(min_value=1, max_value=5, required=True)


@login_required
def new(request, course_id):
    course = get_object_or_404(Course, pk=course_id)
    return render(request, "courses/calificate.html", {"course": course})


@login_required
def create(request, course_id):
    # validate request
    course = get_object_or_404(Course, pk=course_id)
    serializer = CalificationSearializer(data=request.POST)
    if not serializer.is_valid():
        return render(
            request,
            "courses/calificate.html",
            {
                "course": course,
                "errors": serializer.errors,
            },
        )
    params = serializer.validated_data

    # get previous calification if exists
    try:
        cal = Calification.objects.get(user=request.user, course=course)
    except Calification.DoesNotExist:
        cal = Calification(user=request.user, course=course)

    # save
    cal.period = f"{params['year']}-{params['semester']}"
    cal.like = params["like"]
    cal.load = params["load"]
    cal.online_adaptation = params["online_adaptation"]
    cal.communication = params["communication"]
    cal.save()

    # devalidate cache of course period
    cache.delete(f"s_{course.initials}_{cal.period}")

    return redirect("courses:course", initials=course.initials)

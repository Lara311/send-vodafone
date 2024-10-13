from django.urls import path
from . import views

urlpatterns = [
    path('', views.floor_dropdown, name='floor_dropdown'),
    path('mtx/racks_sites/<str:site_name>/<str:floor_name>/', views.floor_view, name='floor_view'),
    path('mtx/assign_rack/<str:site_name>/<str:floor_name>/<int:figure_id>', views.assign_racks_page, name='assign_rack'),
    path('mtx/edit_rack/<str:site_name>/<str:floor_name>/<int:rack_id>', views.edit_racks_page, name='edit_rack'),
    path('add_figure/', views.add_figure, name='add_figure'),
    path('update_floor/', views.update_floor, name='update_floor'),
    path('delete_figure/<int:id>/', views.delete_figure, name='delete_figure'),
    path('edit_figure/<int:id>/', views.edit_figure, name='edit_figure'),
]
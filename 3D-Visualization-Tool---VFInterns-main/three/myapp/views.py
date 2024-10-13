from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, QueryDict, JsonResponse, HttpResponseRedirect
from django.core.serializers import serialize
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from .models import Figure, Floor
import json

def floor_view(request, site_name, floor_name):
    """
    Renders the floor view with all associated figures for a given floor.
    
    Parameters:
    - site_name: Name of the site.
    - floor_name: Name of the floor.

    Returns:
    - Renders the 'floor_view.html' template with context including floor and figures data.
    """
    try:
        # Fetch the floor object based on site_name and floor_name
        floor = Floor.objects.get(site_name=site_name, name=floor_name)
        figures = floor.figures.all()  # Get all figures related to the floor
        
        # Serialize the floor and figures data into JSON format
        floor_json = serialize('json', [floor])[1:-1]  # Serialize floor object, trim surrounding brackets
        figures_json = serialize('json', figures)  # Serialize all figures

        # Context to pass to the template
        context = {
            'floor': floor,
            'floor_json': floor_json,
            'figures_json': figures_json,
            'floors': Floor.objects.all(),  # Get all floors for the dropdown list
            'figure_name_choices': Figure.MODEL_NAME_CHOICES  # Choices for figure names in forms
        }
        
        # Render the template with the provided context
        return render(request, 'myapp/floor_view.html', context)
    
    except Floor.DoesNotExist:
        # Return a 404 error if the floor does not exist
        return HttpResponse(f"Floor with site_name={site_name} and floor_name={floor_name} does not exist", status=404)
    

def floor_dropdown(request):
    """
    Renders a dropdown list of all available floors.
    
    Returns:
    - Renders the 'floor_dropdown.html' template with all floors in context.
    """
    floors = Floor.objects.all()  # Fetch all floors from the database
    context = {
        'floors': floors,  # Pass the list of floors to the template
    }

    return render(request, 'myapp/floor_dropdown.html', context)


def add_figure(request):
    """
    Handles the addition of a new figure to a specified floor.
    
    Returns:
    - Redirects to the floor view page after successful addition.
    """
    if request.method == "POST":
        floor_id = request.POST.get('floor_id')  # Get the floor ID from the POST request
        if not floor_id or not floor_id.isdigit():
            return HttpResponse("Invalid floor_id provided", status=400)

        # Fetch the floor object or return 404 if not found
        floor = get_object_or_404(Floor, id=int(floor_id))

        # Create a new figure and populate its fields with data from the POST request
        figure = Figure()
        figure.floor = floor
        figure.x_position = request.POST.get('x_position')
        figure.y_position = request.POST.get('y_position')
        figure.height = request.POST.get('height')
        figure.width = request.POST.get('width')
        figure.depth = request.POST.get('depth')
        figure.figure_type = request.POST.get('figure_type')
        figure.color = request.POST.get('figure_color')
        figure.angle = int(request.POST.get('angle', 0))
        figure.figure_name = request.POST.get('figure_name')
        figure.rack_id = 0  # Set default rack_id to 0

        figure.save()  # Save the new figure to the database

        # Redirect to the floor view page
        base_url = reverse('floor_view', args=[floor.site_name, floor.name])
        return HttpResponseRedirect(base_url)
    return redirect('floor_view')  # Redirect to the floor view if the request method is not POST

@csrf_exempt
def update_floor(request):
    """
    Handles updating the properties of a specific floor.
    
    Returns:
    - Redirects to the updated floor view page after saving changes.
    """
    if request.method == "POST":
        floor_id = request.POST.get('floor_id')  # Get the floor ID from the POST request
        if not floor_id or not floor_id.isdigit():
            return HttpResponse("Invalid floor_id provided", status=400)

        # Fetch the floor object or return 404 if not found
        floor = get_object_or_404(Floor, id=int(floor_id))

        # Update floor properties with values from the POST request, or keep existing values if not provided
        floor.width = request.POST.get('width', floor.width)
        floor.length = request.POST.get('length', floor.length)
        floor.gridx = request.POST.get('gridx', floor.gridx)
        floor.gridy = request.POST.get('gridy', floor.gridy)
        floor.color = request.POST.get('color', floor.color).lstrip('#')  # Remove leading '#' from the color

        floor.save()  # Save the updated floor to the database

        # Redirect to the floor view page
        base_url = reverse('floor_view', args=[floor.site_name, floor.name])
        return HttpResponseRedirect(base_url)
    return redirect('floor_view')  # Redirect to the floor view if the request method is not POST

@csrf_exempt    
def delete_figure(request, id):
    """
    Handles deletion of a figure based on its ID.
    
    Returns:
    - A JSON response indicating success or failure.
    """
    if request.method == 'DELETE':
        print('the id of deletion:', id)
        try:
            # Fetch the figure by ID and delete it
            figure = Figure.objects.get(id=id)
            figure.delete()
            return JsonResponse({'status': 'success'})
        except Figure.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Figure not found'}, status=404)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def edit_figure(request, id):
    """
    Handles editing of a figure's properties based on its ID.
    
    Returns:
    - A JSON response indicating success or failure.
    """
    if request.method == 'PUT':
        try:
            # Fetch the figure by ID
            figure = Figure.objects.get(id=id)
            data = json.loads(request.body)  # Parse JSON data from the request body
            
            # Update the figure properties with the parsed data
            figure.x_position = data['x_position']
            figure.y_position = data['y_position']
            figure.width = data['width']
            figure.height = data['height']
            figure.depth = data['depth']
            figure.angle = data['angle']
            figure.color = data['color']
            figure.save()  # Save the updated figure to the database

            return JsonResponse({'status': 'success'}) 
        except Figure.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Figure not found'}, status=404)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def edit_racks_page(request, site_name, floor_name, rack_id):
    """
    Placeholder view for editing racks on a specific floor.
    
    Returns:
    - A simple HTTP response indicating the page.
    """
    return HttpResponse("Editing Racks Page")

def assign_racks_page(request, site_name, floor_name, figure_id):
    """
    Placeholder view for assigning racks on a specific floor.
    
    Returns:
    - A simple HTTP response indicating the page.
    """
    return HttpResponse("Assigning Racks Page")
